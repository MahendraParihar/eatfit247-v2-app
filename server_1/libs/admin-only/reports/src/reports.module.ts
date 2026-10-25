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
import { TaxEngineModule } from '@server_1/modules/tax-engine';
import {
  AnnualDashboardController,
  DashboardController,
  DocumentsIssuedController,
  MemberProductReportController,
  PaymentReportController,
} from './controllers';
import {
  AnnualDashboardService,
  DashboardService,
  DocumentsIssuedService,
  FinancialYearService,
  MemberProductReportService,
  PaymentReportService,
} from './services';

@Module({
  imports: [
    MemberModule,
    DeliveryModule,
    TaxEngineModule,
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
    DocumentsIssuedController,
  ],
  providers: [
    FinancialYearService,
    DashboardService,
    AnnualDashboardService,
    PaymentReportService,
    MemberProductReportService,
    DocumentsIssuedService,
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
