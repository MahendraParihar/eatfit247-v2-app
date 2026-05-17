import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { IAuthUser } from '@eatfit247-shared-lib';
import { MstAdminUser, TxnContactForm } from '@server_1/core';
import { GoogleService } from '@server_1/platform';
import { TxnAppointment } from '../models/txn-appointment.model';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { AppointmentListDto } from '../dto/appointment-list.dto';

// Appointment status IDs (matching mst_appointment_statuses seed)
const STATUS = {
  SCHEDULED: 1,
  CONFIRMED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  NO_SHOW: 5,
} as const;

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    @InjectModel(TxnAppointment)
    private readonly appointmentRepository: typeof TxnAppointment,
    @InjectModel(MstAdminUser)
    private readonly adminUserRepository: typeof MstAdminUser,
    @InjectModel(TxnContactForm)
    private readonly contactFormRepository: typeof TxnContactForm,
    private readonly googleService: GoogleService,
  ) {}

  async findAll(query: AppointmentListDto, user: IAuthUser) {
    const where: Record<string, unknown> = { active: true };

    // Franchise scoping — prevent franchise leakage
    if (user.franchiseIds.length > 0) {
      if (query.franchiseId && user.franchiseIds.includes(query.franchiseId)) {
        where['franchiseId'] = query.franchiseId;
      } else {
        where['franchiseId'] = { [Op.in]: user.franchiseIds };
      }
    }
    // Super Admin (empty franchiseIds): no franchise filter

    if (query.status) where['status'] = query.status;
    if (query.assignedAdminId) where['assignedAdminId'] = query.assignedAdminId;
    if (query.fromDate && query.toDate) {
      where['appointmentDate'] = { [Op.between]: [query.fromDate, query.toDate] };
    } else if (query.fromDate) {
      where['appointmentDate'] = { [Op.gte]: query.fromDate };
    } else if (query.toDate) {
      where['appointmentDate'] = { [Op.lte]: query.toDate };
    }

    return TxnAppointment.scope('list').findAndCountAll({
      where,
      limit: query.limit,
      offset: query.page * query.limit,
      order: [['appointmentDate', 'DESC'], ['startTime', 'ASC']],
    });
  }

  async findById(id: number, user: IAuthUser) {
    const appointment = await TxnAppointment.scope('details').findByPk(id);
    if (!appointment || !appointment.active) {
      throw new NotFoundException('Appointment not found');
    }

    // Franchise check
    if (user.franchiseIds.length > 0 && !user.franchiseIds.includes(appointment.franchiseId)) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async create(dto: CreateAppointmentDto, user: IAuthUser, ip: string) {
    // 1. Validate nutritionist
    const nutritionist = await this.adminUserRepository.findByPk(dto.assignedAdminId);
    if (!nutritionist || !nutritionist.active) {
      throw new BadRequestException('Nutritionist is not active or does not exist');
    }
    if (!nutritionist.googleRefreshToken) {
      throw new BadRequestException('Nutritionist has not connected Google Calendar');
    }

    // 2. Franchise check
    if (user.franchiseIds.length > 0 && nutritionist.franchiseId != null) {
      if (!user.franchiseIds.includes(nutritionist.franchiseId)) {
        throw new BadRequestException('Nutritionist is not in your franchise');
      }
    }

    // 3. Date validation
    const today = new Date().toISOString().split('T')[0];
    if (dto.appointmentDate < today) {
      throw new BadRequestException('Appointment date cannot be in the past');
    }

    // 4. Time validation
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // 5. Overlap check
    const overlap = await this.appointmentRepository.findOne({
      where: {
        assignedAdminId: dto.assignedAdminId,
        appointmentDate: dto.appointmentDate,
        active: true,
        status: { [Op.notIn]: [STATUS.CANCELLED] },
        [Op.or]: [
          { startTime: { [Op.lt]: dto.endTime }, endTime: { [Op.gt]: dto.startTime } },
        ],
      },
    });
    if (overlap) {
      throw new BadRequestException('Time slot overlaps with an existing appointment');
    }

    // 6. Contact form validation
    if (dto.contactFormId) {
      const contactForm = await this.contactFormRepository.findByPk(dto.contactFormId);
      if (!contactForm) {
        throw new NotFoundException('Contact form not found');
      }
    }

    // 7. Member validation (string-based to avoid NX circular dep)
    if (dto.memberId) {
      const member = await this.appointmentRepository.sequelize!.models['txn_members']?.findByPk(dto.memberId);
      if (!member) {
        throw new NotFoundException('Member not found');
      }
    }

    // 8. Google Calendar event
    const dateRange = {
      start: `${dto.appointmentDate}T${dto.startTime}:00`,
      end: `${dto.appointmentDate}T${dto.endTime}:00`,
    };
    const attendeeEmail = dto.guestEmail || '';
    const calendarEvent = await this.googleService.bookSlot(
      nutritionist,
      false,
      '',
      attendeeEmail,
      !!attendeeEmail,
      dateRange,
    );

    // 9. Create appointment
    const franchiseId = nutritionist.franchiseId!;
    return this.appointmentRepository.create({
      contactFormId: dto.contactFormId || null,
      memberId: dto.memberId || null,
      assignedAdminId: dto.assignedAdminId,
      bookedByAdminId: user.adminId,
      franchiseId,
      appointmentDate: dto.appointmentDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      status: STATUS.SCHEDULED,
      appointmentType: dto.appointmentType,
      guestName: dto.guestName || null,
      guestEmail: dto.guestEmail || null,
      guestPhone: dto.guestPhone || null,
      notes: dto.notes || null,
      googleEventId: calendarEvent?.id || null,
      createdBy: user.adminId,
      modifiedBy: user.adminId,
      createdIp: ip,
      modifiedIp: ip,
    } as Partial<TxnAppointment>);
  }

  async update(id: number, dto: UpdateAppointmentDto, user: IAuthUser, ip: string) {
    const appointment = await this.findById(id, user);

    // Status change to Cancelled
    if (dto.status === STATUS.CANCELLED) {
      if (!dto.cancellationReason) {
        throw new BadRequestException('Cancellation reason is required');
      }
      // Cancel Google Calendar event (non-blocking)
      if (appointment.googleEventId) {
        try {
          const nutritionist = await this.adminUserRepository.findByPk(appointment.assignedAdminId);
          if (nutritionist) {
            await this.googleService.cancelSlot(nutritionist, { id: appointment.googleEventId } as never);
          }
        } catch (err) {
          this.logger.error(`Failed to cancel calendar event: ${err}`);
        }
      }
    }

    // Reschedule (date/time change)
    if (dto.appointmentDate || dto.startTime || dto.endTime) {
      // Block reschedule for terminal statuses
      if (([STATUS.CANCELLED, STATUS.COMPLETED] as number[]).includes(appointment.status)) {
        throw new BadRequestException('Cannot reschedule a cancelled or completed appointment');
      }

      const newDate = dto.appointmentDate || appointment.appointmentDate;
      const newStart = dto.startTime || appointment.startTime;
      const newEnd = dto.endTime || appointment.endTime;

      if (newStart >= newEnd) {
        throw new BadRequestException('Start time must be before end time');
      }

      // Overlap check (exclude current appointment)
      const overlap = await this.appointmentRepository.findOne({
        where: {
          assignedAdminId: appointment.assignedAdminId,
          appointmentDate: newDate,
          active: true,
          appointmentId: { [Op.ne]: id },
          status: { [Op.notIn]: [STATUS.CANCELLED] },
          [Op.or]: [
            { startTime: { [Op.lt]: newEnd }, endTime: { [Op.gt]: newStart } },
          ],
        },
      });
      if (overlap) {
        throw new BadRequestException('Time slot overlaps with an existing appointment');
      }

      // Update Google Calendar event (non-blocking)
      if (appointment.googleEventId) {
        try {
          const nutritionist = await this.adminUserRepository.findByPk(appointment.assignedAdminId);
          if (nutritionist) {
            const dateRange = {
              start: `${newDate}T${newStart}:00`,
              end: `${newDate}T${newEnd}:00`,
            };
            await this.googleService.updateSlot(
              nutritionist,
              { id: appointment.googleEventId } as never,
              dateRange,
            );
          }
        } catch (err) {
          this.logger.error(`Failed to update calendar event: ${err}`);
        }
      }
    }

    const updateData: Record<string, unknown> = { modifiedBy: user.adminId, modifiedIp: ip };
    if (dto.appointmentDate) updateData['appointmentDate'] = dto.appointmentDate;
    if (dto.startTime) updateData['startTime'] = dto.startTime;
    if (dto.endTime) updateData['endTime'] = dto.endTime;
    if (dto.status != null) updateData['status'] = dto.status;
    if (dto.cancellationReason) updateData['cancellationReason'] = dto.cancellationReason;
    if (dto.notes !== undefined) updateData['notes'] = dto.notes;

    await appointment.update(updateData);
    return this.findById(id, user);
  }

  async softDelete(id: number, user: IAuthUser, ip: string) {
    const appointment = await this.findById(id, user);

    // Cancel Google Calendar event if exists
    if (appointment.googleEventId) {
      try {
        const nutritionist = await this.adminUserRepository.findByPk(appointment.assignedAdminId);
        if (nutritionist) {
          await this.googleService.cancelSlot(nutritionist, { id: appointment.googleEventId } as never);
        }
      } catch (err) {
        this.logger.error(`Failed to cancel calendar event on delete: ${err}`);
      }
    }

    await appointment.update({
      active: false,
      modifiedBy: user.adminId,
      modifiedIp: ip,
    });
  }
}
