import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TxnContactForm, MstAdminUser } from '@server_1/core';
import { PublicContactFormController, ContactFormReportController } from './controllers';
import { ContactFormService, ContactFormReportService } from './services';

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

