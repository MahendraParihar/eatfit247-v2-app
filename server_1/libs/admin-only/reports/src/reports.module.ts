import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MemberModule, TxnMember, TxnMemberDietPlan, TxnMemberIssue, TxnMemberPayment } from '@server_1/modules/member';
import { TxnContactForm } from '@server_1/core';
import { DashboardController, PaymentReportController, ContactFormReportController } from './controllers';
import { DashboardService, PaymentReportService, ContactFormReportService } from './services';

@Module({
  imports: [
    MemberModule,
    SequelizeModule.forFeature([
      TxnMember,
      TxnMemberPayment,
      TxnMemberDietPlan,
      TxnMemberIssue,
      TxnContactForm,
    ]),
  ],
  controllers: [DashboardController, PaymentReportController, ContactFormReportController],
  providers: [DashboardService, PaymentReportService, ContactFormReportService],
  exports: [
    SequelizeModule,
    DashboardService,
    PaymentReportService,
    ContactFormReportService,
  ],
})
export class ReportsModule {
}
