import { Module } from '@nestjs/common';
import { ContactUsReportController } from './controllers/contact-us-report.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { ExceptionService } from '../common/exception.service';
import { CommonService } from '../common/common.service';
import { ContactUsReportService } from './contact-us-report.service';
import { MailModule } from 'src/core/mail/mail.module';

@Module({
  imports: [SequelizeModule.forFeature(ModelList), MailModule],
  controllers: [ContactUsReportController],
  providers: [ExceptionService, ContactUsReportService, CommonService],
})
export class ReportModule {}
