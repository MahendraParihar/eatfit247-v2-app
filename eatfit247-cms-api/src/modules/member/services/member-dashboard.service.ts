import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { MstIssueStatus } from 'src/core/database/models/mst-issue-status.model';
import { MstPaymentMode } from 'src/core/database/models/mst-payment-mode.model';
import { MstPlanStatus } from 'src/core/database/models/mst-plan-status.model';
import { MstProgramPlan } from 'src/core/database/models/mst-program-plan.model';
import { MstProgram } from 'src/core/database/models/mst-program.model';
import { MstRecipe } from 'src/core/database/models/mst-recipe.model';
import { MstUserStatus } from 'src/core/database/models/mst_user_status.model';
import { TxnMemberDietPlan } from 'src/core/database/models/txn-member-diet-plan.model';
import { TxnMemberIssue } from 'src/core/database/models/txn-member-issue.model';
import { TxnMemberPayment } from 'src/core/database/models/txn-member-payment.model';
import { TxnMember } from 'src/core/database/models/txn-member.model';
import { IDashboardCount, PaymentStatusEnum } from 'shared-lib';
import { mean, uniq } from 'lodash';
import { IDashboardItem, IDashboardModel } from 'shared-lib';
import moment from 'moment';

@Injectable()
export class MemberDashboardService {
  constructor(
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(MstUserStatus) private readonly userStatusRepository: typeof MstUserStatus,
    @InjectModel(TxnMemberIssue) private readonly memberIssueRepository: typeof TxnMemberIssue,
    @InjectModel(TxnMemberDietPlan) private readonly memberDietPlanRepository: typeof TxnMemberDietPlan,
    @InjectModel(MstRecipe) private readonly recipeRepository: typeof MstRecipe,
    @InjectModel(TxnMemberPayment) private readonly memberPaymentRepository: typeof TxnMemberPayment,
    @InjectModel(MstIssueStatus) private readonly issueStatusRepository: typeof MstIssueStatus,
    @InjectModel(MstPlanStatus) private readonly planStatusRepository: typeof MstPlanStatus,
    @InjectModel(MstProgramPlan) private readonly programPlanRepository: typeof MstProgramPlan,
    @InjectModel(MstProgram) private readonly programRepository: typeof MstProgram,
    @InjectModel(MstPaymentMode) private readonly paymentModeRepository: typeof MstPaymentMode,
  ) {}

  async getDashboardData(): Promise<IDashboardCount> {
    const [totalDietPlans,
      totalMembers,
      totalRecipes,
      totalRenewedPlans,
      totalNewPlans,
      totalAverageNewPlans,
      memberStatusCountList,
      issueStatusCountList,
      memberProgramCountList,
      memberPlanCountList,
      paymentModeCountList,
      memberCountByMonthList] = await Promise.all([
      this.getTotalDietSessions(),
      this.getTotalMembers(),
      this.getTotalRecipes(),
      this.getTotalRenewedPlans(),
      this.getTotalNewPlans(),
      this.getAverageMonlthyPlans(),
      this.getMemberCountByStatus(),
      this.getIssueCountByStatus(),
      this.getMemberCountByProgram(),
      this.getMemberCountByPlan(),
      this.getMemberCountByPaymentModes(),
      this.getMembersByMonth(),
    ]);
    return {
      totalDietPlans: totalDietPlans,
      totalMembers: totalMembers,
      totalRecipes: totalRecipes,
      totalRenewedPlans: totalRenewedPlans,
      totalNewPlans: totalNewPlans,
      totalAverageNewPlans: totalAverageNewPlans,
      memberStatusCountList: memberStatusCountList,
      issueStatusCountList: issueStatusCountList,
      memberProgramCountList: memberProgramCountList,
      memberPlanCountList: memberPlanCountList,
      paymentModeCountList: paymentModeCountList,
      memberCountByMonthList: memberCountByMonthList,
    };
  }

  getMonthList(filterdItems): IDashboardItem[] {
    const currentYear: number = new Date().getFullYear();
    let month: string;
    const monthList: IDashboardItem[] = [];
    for (let i = 1; i <= 12; i++) {
      month = moment(`${currentYear}-${i}-1`, 'yyyy-MM-dd').format('MMM');
      monthList.push({
        id: i,
        name: month,
        value: filterdItems.find((y) => y.month === i)?.['count'] || 0,
      });
    }
    return monthList;
  }

  private async getMemberCountByStatus(): Promise<IDashboardItem[]> {
    const memberCountList = await this.memberRepository.findAll({
      group: ['userStatusId'],
      attributes: ['userStatusId', [Sequelize.fn('COUNT', 'memberId'), 'count']],
      raw: true,
      nest: true,
    });
    const statusList = await this.userStatusRepository.findAll({
      where: { active: true },
      raw: true,
      nest: true,
      attributes: ['userStatusId', 'userStatus'],
    });
    return statusList.map((x) => {
      return {
        id: x.userStatusId,
        name: x.userStatus,
        value: memberCountList.find((y) => y.userStatusId === x.userStatusId)?.['count'] || 0,
      };
    });
  }

  private async getIssueCountByStatus(): Promise<IDashboardItem[]> {
    const memberIssueList = await this.memberIssueRepository.findAll({
      group: ['issueStatusId'],
      attributes: ['issueStatusId', [Sequelize.fn('COUNT', 'memberIssueId'), 'count']],
      raw: true,
      nest: true,
    });
    const statusList = await this.issueStatusRepository.findAll({
      where: { active: true },
      raw: true,
      nest: true,
      attributes: ['issueStatusId', 'issueStatus'],
    });
    return statusList.map((x) => {
      return <IDashboardItem>{
        id: x.issueStatusId,
        name: x.issueStatus,
        value: memberIssueList.find((y) => y.issueStatusId === x.issueStatusId)?.['count'] || 0,
      };
    });
  }

  private async getMemberCountByProgram(): Promise<IDashboardItem[]> {
    const memberProgramList = await this.memberPaymentRepository.findAll({
      group: ['programId'],
      attributes: ['programId', [Sequelize.fn('COUNT', 'memberPaymentId'), 'count']],
      raw: true,
      nest: true,
    });
    const programList = await this.programRepository.findAll({
      where: { active: true },
      raw: true,
      nest: true,
      attributes: ['programId', 'program'],
    });
    return programList.map((x) => {
      return {
        id: x.programId,
        name: x.program,
        value: memberProgramList.find((y) => y.programId === x.programId)?.['count'] || 0,
      };
    });
  }

  private async getMemberCountByPlan(): Promise<IDashboardItem[]> {
    const memberPaymentList = await this.memberPaymentRepository.findAll({
      group: ['programPlanId'],
      attributes: ['programPlanId', [Sequelize.fn('COUNT', 'memberPaymentId'), 'count']],
      raw: true,
      nest: true,
    });
    const programPlanList = await this.programPlanRepository.findAll({
      where: { active: true },
      raw: true,
      nest: true,
      attributes: ['programPlanId', 'plan'],
    });
    return programPlanList.map((x) => {
      return {
        id: x.programPlanId,
        name: x.plan,
        value: memberPaymentList.find((y) => y.programPlanId === x.programPlanId)?.['count'] || 0,
      };
    });
  }

  private async getMemberCountByPaymentModes(): Promise<IDashboardItem[]> {
    const memberPaymentList = await this.memberPaymentRepository.findAll({
      group: ['paymentModeId'],
      attributes: ['paymentModeId', [Sequelize.fn('COUNT', 'memberPaymentId'), 'count']],
      raw: true,
      nest: true,
    });
    const paymentModeList = await this.paymentModeRepository.findAll({
      where: { active: true },
      raw: true,
      nest: true,
      attributes: ['paymentModeId', 'paymentMode'],
    });
    return paymentModeList.map((x) => {
      return {
        id: x.paymentModeId,
        name: x.paymentMode,
        value: memberPaymentList.find((y) => y.paymentModeId === x.paymentModeId)?.['count'] || 0,
      };
    });
  }

  private async getTotalDietSessions(): Promise<number> {
    const result = await this.memberDietPlanRepository.findOne({
      attributes: [[Sequelize.fn('COUNT', 'memberDietPlanId'), 'count']],
      raw: true,
      nest: true,
    });
    return result['count'];
  }

  private async getTotalMembers(): Promise<number> {
    const result = await this.memberRepository.findOne({
      attributes: [[Sequelize.fn('COUNT', 'memberId'), 'count']],
      raw: true,
      nest: true,
    });
    return result['count'];
  }

  private async getTotalRecipes(): Promise<number> {
    const result = await this.recipeRepository.findOne({
      attributes: [[Sequelize.fn('COUNT', 'recipeId'), 'count']],
      where: { active: true },
      raw: true,
      nest: true,
    });
    return result['count'];
  }

  private async getTotalRenewedPlans(): Promise<number> {
    const result = await this.memberPaymentRepository.findAll({
      attributes: [[Sequelize.fn('COUNT', 'memberPaymentId'), 'count']],
      group: ['member_id'],
      where: { active: true, paymentStatusId: PaymentStatusEnum.PAID },
      raw: true,
      nest: true,
    });
    const renewResult = result.filter((x) => x['count'] > 1);
    return renewResult.length;
  }

  private async getTotalNewPlans(): Promise<number> {
    const result = await this.memberPaymentRepository.findAll({
      attributes: [[Sequelize.fn('COUNT', 'memberPaymentId'), 'count']],
      group: ['member_id'],
      where: { active: true, paymentStatusId: PaymentStatusEnum.PAID },
      raw: true,
      nest: true,
    });
    const renewResult = result.filter((x) => x['count'] === 1);
    return renewResult.length;
  }

  private async getAverageMonlthyPlans(): Promise<number> {
    const result = await this.memberPaymentRepository.findAll({
      attributes: [[Sequelize.fn('COUNT', 'memberPaymentId'), 'count']],
      where: { active: true, paymentStatusId: PaymentStatusEnum.PAID },
      group: [
        Sequelize.fn('date_part', 'year', Sequelize.col('payment_date')),
        Sequelize.fn('date_part', 'month', Sequelize.col('payment_date')),
      ],
      raw: true,
      nest: true,
    });
    const array = result.map((x) => Number(x['count'] || 0));
    return mean(array);
  }

  private async getMembersByMonth(): Promise<IDashboardModel[]> {
    const result = await this.memberRepository.findAll({
      attributes: [
        [Sequelize.fn('date_part', 'year', Sequelize.col('created_at')), 'year'],
        [Sequelize.fn('date_part', 'month', Sequelize.col('created_at')), 'month'],
        [Sequelize.fn('COUNT', 'memberId'), 'count'],
      ],
      group: [
        Sequelize.fn('date_part', 'year', Sequelize.col('created_at')),
        Sequelize.fn('date_part', 'month', Sequelize.col('created_at')),
      ],
      raw: true,
      nest: true,
    });
    const yearArray = uniq(result.map((x) => x['year']));
    let filterdItems;
    const list: IDashboardModel[] = [];
    for (const item of yearArray) {
      filterdItems = result.filter((x) => x['year'] == item);
      list.push({
        id: item,
        items: this.getMonthList(filterdItems),
      });
    }
    return list;
  }
}
