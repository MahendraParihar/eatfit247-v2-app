import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { IAuthUser } from '@eatfit247-shared-lib';
import { MstAdminUser, TxnAdminUserRole } from '@server_1/core';
import { GoogleService } from '@server_1/platform';
import { MstAdminRole } from '@server_1/core';
import { Op } from 'sequelize';

@Injectable()
export class AppointmentAvailabilityService {
  private readonly logger = new Logger(AppointmentAvailabilityService.name);

  constructor(
    @InjectModel(MstAdminUser)
    private readonly adminUserRepository: typeof MstAdminUser,
    @InjectModel(TxnAdminUserRole)
    private readonly userRoleRepository: typeof TxnAdminUserRole,
    private readonly googleService: GoogleService,
  ) {}

  async getNutritionists(user: IAuthUser) {
    // Find admin IDs with nutritionist role
    const nutritionistRoleAssignments = await this.userRoleRepository.findAll({
      where: { active: true },
      include: [
        {
          model: MstAdminRole,
          as: 'role',
          where: { roleCode: 'nutritionist' },
          attributes: ['roleId', 'roleCode'],
          required: true,
        },
      ],
      attributes: ['adminId'],
    });

    const nutritionistAdminIds = nutritionistRoleAssignments.map((ra) => ra.adminId);
    if (nutritionistAdminIds.length === 0) return [];

    // Build where clause with franchise scoping
    const where: Record<string, unknown> = {
      adminId: { [Op.in]: nutritionistAdminIds },
      active: true,
    };

    // Franchise scoping (Super Admin with empty franchiseIds sees all)
    if (user.franchiseIds.length > 0) {
      where['franchiseId'] = { [Op.in]: user.franchiseIds };
    }

    const nutritionists = await this.adminUserRepository.findAll({
      where,
      attributes: [
        'adminId', 'firstName', 'lastName', 'emailId',
        'franchiseId', 'googleCalendarEmail', 'googleRefreshToken',
      ],
    });

    return nutritionists.map((n) => ({
      adminId: n.adminId,
      firstName: n.firstName,
      lastName: n.lastName,
      emailId: n.emailId,
      franchiseId: n.franchiseId,
      calendarConnected: !!n.googleRefreshToken,
      calendarEmail: n.googleCalendarEmail,
    }));
  }

  async getAvailability(
    nutritionistId: number,
    fromDate: string,
    toDate: string,
    user: IAuthUser,
    duration = 30,
  ) {
    const nutritionist = await this.adminUserRepository.findByPk(nutritionistId);
    if (!nutritionist || !nutritionist.active) {
      return { slots: [], error: 'Nutritionist not found or inactive' };
    }

    // Franchise check
    if (user.franchiseIds.length > 0 && nutritionist.franchiseId != null) {
      if (!user.franchiseIds.includes(nutritionist.franchiseId)) {
        return { slots: [], error: 'Nutritionist is not in your franchise' };
      }
    }

    if (!nutritionist.googleRefreshToken) {
      return { slots: [], error: 'Nutritionist has not connected Google Calendar' };
    }

    try {
      const slots = await this.googleService.availableSlots(nutritionist, {
        nutritionistId,
        fromDate,
        toDate,
        duration,
      });
      return { slots };
    } catch (err) {
      this.logger.error(`Failed to fetch availability: ${err}`);
      return { slots: [], error: 'Failed to fetch calendar availability' };
    }
  }
}
