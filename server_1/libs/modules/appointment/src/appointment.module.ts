import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
import { modelRegistry, MstAdminUser, TxnAdminUserRole, TxnContactForm } from '@server_1/core';
import { NotificationModule } from '@server_1/modules/notification';
import { TxnAppointment } from './models/txn-appointment.model';
import { MstAppointmentStatus } from './models/mst-appointment-status.model';
import { MstAppointmentType } from './models/mst-appointment-type.model';
import { AppointmentService } from './services/appointment.service';
import { AppointmentAvailabilityService } from './services/appointment-availability.service';
import { AppointmentReminderCron } from './services/appointment-reminder.cron';
import { AppointmentController } from './controllers/admin/appointment.controller';
import { AppointmentAvailabilityController } from './controllers/admin/appointment-availability.controller';

// Register models with the model registry before CommonModule.forRoot() initializes Sequelize
modelRegistry.register([TxnAppointment, MstAppointmentStatus, MstAppointmentType]);

@Module({
  imports: [
    SequelizeModule.forFeature([
      TxnAppointment,
      MstAppointmentStatus,
      MstAppointmentType,
      MstAdminUser,
      TxnAdminUserRole,
      TxnContactForm,
    ]),
    ScheduleModule.forRoot(),
    NotificationModule,
  ],
  controllers: [AppointmentController, AppointmentAvailabilityController],
  providers: [AppointmentService, AppointmentAvailabilityService, AppointmentReminderCron],
  exports: [AppointmentService, AppointmentAvailabilityService],
})
export class AppointmentModule {}
