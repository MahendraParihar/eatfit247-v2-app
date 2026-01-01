import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser } from '@server_1/core';
import { LogErrorModel, MstEmailTemplate } from '@server_1/platform';
import { EmailService } from './src/services/email.service';
import { EmailController } from './src/controllers';

@Module({
  imports: [
    SequelizeModule.forFeature([
      MstEmailTemplate,
      MstAdminUser,
      LogErrorModel,
    ]),
  ],
  controllers: [
    EmailController,
  ],
  providers: [
    EmailService,
  ],
  exports: [
    EmailService,
    SequelizeModule,
  ],
})
export class NotificationsModule {
}

