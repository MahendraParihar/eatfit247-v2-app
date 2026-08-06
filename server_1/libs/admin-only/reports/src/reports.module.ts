import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstFranchise } from '@server_1/core';
import {
  MemberModule,
  TxnMember,
  TxnMemberDietPlan,
  TxnMemberIssue,
  TxnMemberPayment,
  TxnMemberProduct,
} from '@server_1/modules/member';
import { DeliveryModule, TxnShipment } from '@server_1/modules/delivery';
import {
  AnnualDashboardController,
  DashboardController,
  MemberProductReportController,
  PaymentReportController,
} from './controllers';
import {
  AnnualDashboardService,
  DashboardService,
  FinancialYearService,
  MemberProductReportService,
  PaymentReportService,
} from './services';

@Module({
  imports: [
    MemberModule,
    DeliveryModule,
    SequelizeModule.forFeature([
      MstFranchise,
      TxnMember,
      TxnMemberPayment,
      TxnMemberProduct,
      TxnMemberDietPlan,
      TxnMemberIssue,
      TxnShipment,
    ]),
  ],
  controllers: [
    DashboardController,
    AnnualDashboardController,
    PaymentReportController,
    MemberProductReportController,
  ],
  providers: [
    FinancialYearService,
    DashboardService,
    AnnualDashboardService,
    PaymentReportService,
    MemberProductReportService,
  ],
  exports: [
    SequelizeModule,
    FinancialYearService,
    DashboardService,
    AnnualDashboardService,
    PaymentReportService,
    MemberProductReportService,
  ],
})
export class ReportsModule {
}
