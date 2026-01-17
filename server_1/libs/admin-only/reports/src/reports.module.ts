import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MemberModule, TxnMember, TxnMemberDietPlan, TxnMemberIssue, TxnMemberPayment } from '@server_1/modules/member';
import { DashboardController, PaymentReportController } from './controllers';
import { DashboardService, PaymentReportService } from './services';

@Module({
  imports: [
    MemberModule,
    SequelizeModule.forFeature([
      TxnMember,
      TxnMemberPayment,
      TxnMemberDietPlan,
      TxnMemberIssue,
    ]),
  ],
  controllers: [DashboardController, PaymentReportController],
  providers: [DashboardService, PaymentReportService],
  exports: [
    SequelizeModule,
    DashboardService,
    PaymentReportService,
  ],
})
export class ReportsModule {
}
