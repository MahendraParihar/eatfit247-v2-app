import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser } from '@eatfit247-shared-lib';
import {
  AbilitiesGuard,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
} from '@server_1/core';
import { AppointmentService } from '../../services/appointment.service';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentListDto } from '../../dto';

@Controller('appointment')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Appointment)
  async list(
    @Query() query: AppointmentListDto,
    @CurrentUser() user: IAuthUser,
  ) {
    return this.appointmentService.findAll(query, user);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Appointment)
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: IAuthUser,
  ) {
    return this.appointmentService.findById(id, user);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.Appointment)
  async create(
    @Body() body: CreateAppointmentDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ) {
    return this.appointmentService.create(body, user, ip);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Appointment)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAppointmentDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ) {
    return this.appointmentService.update(id, body, user, ip);
  }

  @Delete('manage/:id')
  @RequireAbility(AdminActionEnum.Delete, AdminSubjectEnum.Appointment)
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ) {
    return this.appointmentService.softDelete(id, user, ip);
  }
}
