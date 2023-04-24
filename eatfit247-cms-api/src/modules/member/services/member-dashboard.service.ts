import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { IServerResponse } from 'src/common-dto/response-interface';
import { IS_DEV } from 'src/constants/config-constants';
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
import { PaymentStatusEnum } from 'src/enums/payment-status-enum';
import { ServerResponseEnum } from 'src/enums/server-response-enum';
import { StringResource } from 'src/enums/string-resource';
import { ExceptionService } from 'src/modules/common/exception.service';
import { mean, uniq } from 'lodash';
import { IDashboardItem, IDashboardModel } from 'src/response-interface/dashboard-item.interface';
import * as moment from 'moment';

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
    private exceptionService: ExceptionService,
  ) {}

  async getDashboardData() {
    let res: IServerResponse;
    try {
      const promiseAll = await Promise.all([
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

      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: {
          totalDietPlans: promiseAll[0],
          totalMembers: promiseAll[1],
          totalRecipes: promiseAll[2],
          totalRenewedPlans: promiseAll[3],
          totalNewPlans: promiseAll[4],
          totalAverageNewPlans: promiseAll[5],
          memberStatusCountList: promiseAll[6],
          issueStatusCountList: promiseAll[7],
          memberProgramCountList: promiseAll[8],
          memberPlanCountList: promiseAll[9],
          paymentModeCountList: promiseAll[10],
          memberCountByMonthList: promiseAll[11],
        },
      };

      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  getMonthList(filterdItems) {
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

  private async getMemberCountByStatus() {
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

  private async getIssueCountByStatus() {
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
      return {
        id: x.issueStatusId,
        name: x.issueStatus,
        value: memberIssueList.find((y) => y.issueStatusId === x.issueStatusId)?.['count'] || 0,
      };
    });
  }

  private async getMemberCountByProgram() {
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

  private async getMemberCountByPlan() {
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

  private async getMemberCountByPaymentModes() {
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

  private async getTotalDietSessions() {
    const result = await this.memberDietPlanRepository.findOne({
      attributes: [[Sequelize.fn('COUNT', 'memberDietPlanId'), 'count']],
      raw: true,
      nest: true,
    });
    return result['count'];
  }

  private async getTotalMembers() {
    const result = await this.memberRepository.findOne({
      attributes: [[Sequelize.fn('COUNT', 'memberId'), 'count']],
      raw: true,
      nest: true,
    });
    return result['count'];
  }

  private async getTotalRecipes() {
    const result = await this.recipeRepository.findOne({
      attributes: [[Sequelize.fn('COUNT', 'recipeId'), 'count']],
      where: { active: true },
      raw: true,
      nest: true,
    });
    return result['count'];
  }

  private async getTotalRenewedPlans() {
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

  private async getTotalNewPlans() {
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

  private async getAverageMonlthyPlans() {
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

  private async getMembersByMonth() {
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
