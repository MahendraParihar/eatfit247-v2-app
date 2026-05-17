import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { NotificationChannel } from '@eatfit247-shared-lib';
import { MstAdminUser } from '@server_1/core';
import { NotificationService } from '@server_1/modules/notification';
import { TxnAppointment } from '../models/txn-appointment.model';

// Status IDs matching mst_appointment_statuses
const STATUS_SCHEDULED = 1;
const STATUS_CONFIRMED = 2;

@Injectable()
export class AppointmentReminderCron {
  private readonly logger = new Logger(AppointmentReminderCron.name);

  constructor(
    @InjectModel(TxnAppointment)
    private readonly appointmentRepository: typeof TxnAppointment,
    @InjectModel(MstAdminUser)
    private readonly adminUserRepository: typeof MstAdminUser,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('0 * * * *') // Every hour
  async processReminders(): Promise<void> {
    this.logger.log('Running appointment reminder cron');

    // Query appointments for tomorrow with reminder_sent=false
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const appointments = await this.appointmentRepository.findAll({
      where: {
        appointmentDate: tomorrowStr,
        reminderSent: false,
        active: true,
        status: { [Op.in]: [STATUS_SCHEDULED, STATUS_CONFIRMED] },
      },
    });

    this.logger.log(`Found ${appointments.length} appointments needing reminders`);

    for (const appointment of appointments) {
      try {
        // Resolve recipient contact info
        const recipientEmail = appointment.guestEmail || null;
        const recipientPhone = appointment.guestPhone || null;

        // If member linked, try to get member contact (string-based to avoid circular dep)
        let memberContact: { email?: string; phone?: string; name?: string } | null = null;
        if (appointment.memberId) {
          const member = await this.appointmentRepository.sequelize!.models['txn_members']?.findByPk(
            appointment.memberId,
            { attributes: ['emailId', 'contactNumber', 'firstName', 'lastName'], raw: true },
          );
          if (member) {
            const m = member as unknown as Record<string, unknown>;
            memberContact = {
              email: m['emailId'] as string | undefined,
              phone: m['contactNumber'] as string | undefined,
              name: `${m['firstName'] || ''} ${m['lastName'] || ''}`.trim(),
            };
          }
        }

        const email = memberContact?.email || recipientEmail;
        const phone = memberContact?.phone || recipientPhone;
        const name = memberContact?.name || appointment.guestName || 'Guest';

        if (!email && !phone) {
          this.logger.warn(`No contact info for appointment ${appointment.appointmentId}, skipping`);
          continue;
        }

        // Resolve nutritionist name
        const nutritionist = await this.adminUserRepository.findByPk(appointment.assignedAdminId, {
          attributes: ['firstName', 'lastName'],
        });
        const nutritionistName = nutritionist
          ? `${nutritionist.firstName} ${nutritionist.lastName}`.trim()
          : 'your nutritionist';

        const templateParams = {
          name,
          date: appointment.appointmentDate,
          time: appointment.startTime,
          nutritionist: nutritionistName,
        };

        // Send email reminder
        if (email) {
          try {
            await this.notificationService.send({
              channel: NotificationChannel.EMAIL,
              recipient: email,
              subject: 'Appointment Reminder - EatFit247',
              templateName: 'appointment-reminder',
              templateParams,
              idempotencyKey: `appt-reminder-${appointment.appointmentId}`,
            });
          } catch (err) {
            this.logger.error(`Email reminder failed for appointment ${appointment.appointmentId}: ${err}`);
          }
        }

        // Send WhatsApp reminder
        if (phone) {
          try {
            await this.notificationService.send({
              channel: NotificationChannel.WHATSAPP,
              recipient: phone,
              templateName: 'appointment-reminder',
              templateParams,
              idempotencyKey: `appt-reminder-wa-${appointment.appointmentId}`,
            });
          } catch (err) {
            this.logger.error(`WhatsApp reminder failed for appointment ${appointment.appointmentId}: ${err}`);
          }
        }

        // Mark reminder as sent
        await appointment.update({ reminderSent: true });
      } catch (err) {
        this.logger.error(`Reminder processing failed for appointment ${appointment.appointmentId}: ${err}`);
        // Continue to next appointment
      }
    }
  }
}
