import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MemberModule, TxnMember, TxnMemberDietPlan, TxnMemberIssue, TxnMemberPayment, TxnMemberProduct } from '@server_1/modules/member';
import { DashboardController, PaymentReportController, MemberProductReportController } from './controllers';
import { DashboardService, PaymentReportService, MemberProductReportService } from './services';

@Module({
  imports: [
    MemberModule,
    SequelizeModule.forFeature([
      TxnMember,
      TxnMemberPayment,
      TxnMemberProduct,
      TxnMemberDietPlan,
      TxnMemberIssue,
    ]),
  ],
  controllers: [DashboardController, PaymentReportController, MemberProductReportController],
  providers: [DashboardService, PaymentReportService, MemberProductReportService],
  exports: [
    SequelizeModule,
    DashboardService,
    PaymentReportService,
    MemberProductReportService,
  ],
})
export class ReportsModule {
}
