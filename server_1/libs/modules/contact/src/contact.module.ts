import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser, TxnContactForm } from '@server_1/core';
import { ContactFormReportController, PublicContactFormController } from './controllers';
import { ContactFormReportService, ContactFormService } from './services';

@Module({
  imports: [
    SequelizeModule.forFeature([TxnContactForm, MstAdminUser]),
  ],
  controllers: [
    PublicContactFormController,
    ContactFormReportController,
  ],
  providers: [
    ContactFormService,
    ContactFormReportService,
  ],
  exports: [
    ContactFormService,
    ContactFormReportService,
    SequelizeModule,
  ],
})
export class ContactModule {
}

