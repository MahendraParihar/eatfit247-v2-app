import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser } from '@eatfit247-shared-lib';
import {
  AbilitiesGuard,
  CurrentUser,
  JwtAuthGuard,
  RequireAbility,
} from '@server_1/core';
import { AppointmentAvailabilityService } from '../../services/appointment-availability.service';

@Controller('appointment/availability')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class AppointmentAvailabilityController {
  constructor(private readonly availabilityService: AppointmentAvailabilityService) {}

  @Get('nutritionists')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Appointment)
  async getNutritionists(@CurrentUser() user: IAuthUser) {
    return this.availabilityService.getNutritionists(user);
  }

  @Get('slots/:nutritionistId')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Appointment)
  async getSlots(
    @Param('nutritionistId', ParseIntPipe) nutritionistId: number,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @CurrentUser() user: IAuthUser,
  ) {
    return this.availabilityService.getAvailability(nutritionistId, fromDate, toDate, user);
  }
}
