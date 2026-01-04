import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MemberModule } from '@server_1/modules/member';
import { TxnMember, TxnMemberPayment, TxnMemberDietPlan, TxnMemberIssue } from '@server_1/modules/member';
import { DashboardController } from './controllers/admin';
import { DashboardService } from './services';

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
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [
    SequelizeModule,
    DashboardService,
  ],
})
export class ReportsModule {
}
