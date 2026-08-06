import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import moment from 'moment';
import { TxnMember, TxnMemberPayment } from '@server_1/modules/member';
import {
  IAnnualFranchiseContext,
  IAnnualOverview,
  IAnnualOverviewMonth,
  IAnnualTaxBreakdown,
  IAnnualTaxRow,
  IAnnualTopPlans,
  IAnnualTopPlanSlice,
  IAuthUser,
  PaymentStatusEnum,
  TopPlansMode,
} from '@eatfit247-shared-lib';
import { FinancialYearService, IFranchiseSummary } from './financial-year.service';

@Injectable()
export class AnnualDashboardService {
  constructor(
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(TxnMemberPayment) private readonly paymentRepository: typeof TxnMemberPayment,
    private readonly financialYearService: FinancialYearService,
  ) {}

  /** Franchises this user is allowed to query. */
  async getAccessibleFranchises(user: IAuthUser): Promise<IFranchiseSummary[]> {
    return await this.financialYearService.getAccessibleFranchises(user);
  }

  /** Resolve which franchise's FY config to use and the list of available FY years. */
  async getFranchiseContext(user: IAuthUser, franchiseId?: number): Promise<IAnnualFranchiseContext> {
    return await this.financialYearService.getFranchiseContext(user, franchiseId);
  }

  /**
   * Monthly customer registrations + monthly plans sold (paid payments) within the FY.
   */
  async getAnnualOverview(
    user: IAuthUser,
    franchiseId: number | undefined,
    fyStartYear: number,
  ): Promise<IAnnualOverview> {
    const context = await this.getFranchiseContext(user, franchiseId);
    const fy = this.financialYearService.findOrBuildFy(context, fyStartYear);
    const startDate = new Date(fy.startDate);
    const endDate = new Date(fy.endDate);

    const franchiseScope = this.financialYearService.buildFranchiseScopeWhere(franchiseId, user);

    const [memberRows, paymentRows] = await Promise.all([
      this.memberRepository.findAll({
        attributes: [
          [Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at')), 'month'],
          [Sequelize.fn('COUNT', Sequelize.col('member_id')), 'count'],
        ],
        where: {
          createdAt: { [Op.gte]: startDate, [Op.lte]: endDate },
          ...franchiseScope,
        },
        group: [Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at'))],
        raw: true,
      }),
      this.paymentRepository.findAll({
        attributes: [
          [Sequelize.fn('date_trunc', 'month', Sequelize.col('payment_date')), 'month'],
          [Sequelize.fn('COUNT', Sequelize.col('member_payment_id')), 'count'],
        ],
        where: {
          paymentDate: { [Op.gte]: startDate, [Op.lte]: endDate },
          paymentStatusId: PaymentStatusEnum.PAID,
          active: true,
          ...franchiseScope,
        },
        group: [Sequelize.fn('date_trunc', 'month', Sequelize.col('payment_date'))],
        raw: true,
      }),
    ]);

    const memberMap = this.toMonthMap(memberRows as unknown as Array<{ month: string; count: string | number }>);
    const paymentMap = this.toMonthMap(paymentRows as unknown as Array<{ month: string; count: string | number }>);

    const months = this.financialYearService
      .buildMonthSequence(context.fyStartMonth, fyStartYear)
      .map<IAnnualOverviewMonth>(({ monthIndex, monthLabel, ymKey }) => ({
        monthIndex,
        monthLabel,
        customerCount: memberMap.get(ymKey) ?? 0,
        planSoldCount: paymentMap.get(ymKey) ?? 0,
      }));

    return { fy, months };
  }

  /**
   * Monthly tax breakdown for the FY (only PAID, active payments with tax applied).
   */
  async getAnnualTaxBreakdown(
    user: IAuthUser,
    franchiseId: number | undefined,
    fyStartYear: number,
  ): Promise<IAnnualTaxBreakdown> {
    const context = await this.getFranchiseContext(user, franchiseId);
    const fy = this.financialYearService.findOrBuildFy(context, fyStartYear);
    const startDate = new Date(fy.startDate);
    const endDate = new Date(fy.endDate);
    const franchiseScope = this.financialYearService.buildFranchiseScopeWhere(franchiseId, user);

    const rows = await this.paymentRepository.findAll({
      attributes: [
        [Sequelize.fn('date_trunc', 'month', Sequelize.col('payment_date')), 'month'],
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('order_amount')), 0), 'taxable'],
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('tax_amount')), 0), 'tax'],
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('total_amount')), 0), 'total'],
      ],
      where: {
        paymentDate: { [Op.gte]: startDate, [Op.lte]: endDate },
        paymentStatusId: PaymentStatusEnum.PAID,
        active: true,
        isTaxApplicable: true,
        ...franchiseScope,
      },
      group: [Sequelize.fn('date_trunc', 'month', Sequelize.col('payment_date'))],
      raw: true,
    });

    const map = new Map<string, { taxable: number; tax: number; total: number }>();
    for (const r of rows as unknown as Array<{ month: string; taxable: string; tax: string; total: string }>) {
      const key = moment(r.month).format('YYYY-MM');
      map.set(key, {
        taxable: Number(r.taxable) || 0,
        tax: Number(r.tax) || 0,
        total: Number(r.total) || 0,
      });
    }

    const taxRows = this.financialYearService
      .buildMonthSequence(context.fyStartMonth, fyStartYear)
      .map<IAnnualTaxRow>(({ monthIndex, monthLabel, ymKey }) => {
        const agg = map.get(ymKey);
        return {
          monthIndex,
          monthLabel,
          taxableAmount: agg?.taxable ?? 0,
          taxAmount: agg?.tax ?? 0,
          totalAmount: agg?.total ?? 0,
        };
      });

    const totals = taxRows.reduce(
      (acc, r) => ({
        taxableAmount: acc.taxableAmount + r.taxableAmount,
        taxAmount: acc.taxAmount + r.taxAmount,
        totalAmount: acc.totalAmount + r.totalAmount,
      }),
      { taxableAmount: 0, taxAmount: 0, totalAmount: 0 },
    );

    return { fy, rows: taxRows, totals };
  }

  /**
   * Top performing program plans within the FY — by count or revenue.
   */
  async getTopPerformingPlans(
    user: IAuthUser,
    franchiseId: number | undefined,
    fyStartYear: number,
    mode: TopPlansMode,
    limit = 6,
  ): Promise<IAnnualTopPlans> {
    const context = await this.getFranchiseContext(user, franchiseId);
    const fy = this.financialYearService.findOrBuildFy(context, fyStartYear);
    const startDate = new Date(fy.startDate);
    const endDate = new Date(fy.endDate);
    const franchiseScope = this.financialYearService.buildFranchiseScopeWhere(franchiseId, user);

    const valueExpr =
      mode === 'revenue'
        ? Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('total_amount')), 0)
        : Sequelize.fn('COUNT', Sequelize.col('member_payment_id'));

    const aggregatedRows = await this.paymentRepository.findAll({
      attributes: ['programPlanId', [valueExpr, 'value']],
      where: {
        paymentDate: { [Op.gte]: startDate, [Op.lte]: endDate },
        paymentStatusId: PaymentStatusEnum.PAID,
        active: true,
        programPlanId: { [Op.ne]: null },
        ...franchiseScope,
      },
      group: ['programPlanId'],
      order: [[Sequelize.literal('value'), 'DESC']],
      limit,
      raw: true,
    });

    const rows = aggregatedRows as unknown as Array<{ programPlanId: number; value: string | number }>;
    const planIds = rows.map((r) => r.programPlanId).filter((id): id is number => id !== null && id !== undefined);

    let planNameMap = new Map<number, string>();
    if (planIds.length > 0) {
      const plans = await this.paymentRepository.sequelize!.models['mst_program_plans'].findAll({
        where: { programPlanId: { [Op.in]: planIds } },
        attributes: ['programPlanId', 'plan'],
        raw: true,
      });
      planNameMap = new Map(
        (plans as unknown as Array<{ programPlanId: number; plan: string }>).map((p) => [p.programPlanId, p.plan]),
      );
    }

    const slices = rows.map<IAnnualTopPlanSlice>((r) => ({
      programPlanId: r.programPlanId,
      planName: planNameMap.get(r.programPlanId) ?? `Plan #${r.programPlanId}`,
      value: Number(r.value) || 0,
    }));

    return { fy, mode, slices };
  }

  // ---- internals ----

  private toMonthMap(rows: Array<{ month: string | Date; count: string | number }>): Map<string, number> {
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = moment(r.month).format('YYYY-MM');
      map.set(key, Number(r.count) || 0);
    }
    return map;
  }
}
