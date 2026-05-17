import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import moment from 'moment';
import { MstFranchise } from '@server_1/core';
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
  IFinancialYearOption,
  PaymentStatusEnum,
  TopPlansMode,
} from '@eatfit247-shared-lib';

interface IFranchiseSummary {
  franchiseId: number;
  companyName: string;
}

@Injectable()
export class AnnualDashboardService {
  constructor(
    @InjectModel(MstFranchise) private readonly franchiseRepository: typeof MstFranchise,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(TxnMemberPayment) private readonly paymentRepository: typeof TxnMemberPayment,
  ) {}

  /**
   * Franchises this user is allowed to query.
   * - franchise_admin: only own franchiseIds
   * - super_admin (empty franchiseIds): all active franchises
   */
  async getAccessibleFranchises(user: IAuthUser): Promise<IFranchiseSummary[]> {
    const where: Record<string, unknown> = { active: true };
    if (user.franchiseIds && user.franchiseIds.length > 0) {
      where['franchiseId'] = { [Op.in]: user.franchiseIds };
    }
    const list = await this.franchiseRepository.findAll({
      where,
      attributes: ['franchiseId', 'companyName'],
      order: [['companyName', 'ASC']],
      raw: true,
    });
    return list.map((f) => ({ franchiseId: f.franchiseId, companyName: f.companyName }));
  }

  /**
   * Resolve which franchise's FY config to use and the list of available FY years.
   */
  async getFranchiseContext(user: IAuthUser, franchiseId?: number): Promise<IAnnualFranchiseContext> {
    const resolvedFranchise = await this.resolveFranchise(user, franchiseId);
    const fyStartMonth = this.normaliseFyStartMonth(resolvedFranchise.financialYear);
    const availableYears = await this.buildAvailableYears(resolvedFranchise.franchiseId, fyStartMonth);

    return {
      franchiseId: resolvedFranchise.franchiseId,
      companyName: resolvedFranchise.companyName,
      fyStartMonth,
      availableYears,
    };
  }

  /**
   * Monthly customer registrations + monthly plans sold (paid payments) within the FY.
   */
  async getAnnualOverview(user: IAuthUser, franchiseId: number | undefined, fyStartYear: number): Promise<IAnnualOverview> {
    const context = await this.getFranchiseContext(user, franchiseId);
    const fy = this.findOrBuildFy(context, fyStartYear);
    const startDate = new Date(fy.startDate);
    const endDate = new Date(fy.endDate);

    const franchiseScope = this.buildFranchiseScopeWhere(franchiseId, user);

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

    const months = this.buildMonthSequence(context.fyStartMonth, fyStartYear).map<IAnnualOverviewMonth>(
      ({ monthIndex, monthLabel, ymKey }) => ({
        monthIndex,
        monthLabel,
        customerCount: memberMap.get(ymKey) ?? 0,
        planSoldCount: paymentMap.get(ymKey) ?? 0,
      }),
    );

    return { fy, months };
  }

  /**
   * Monthly tax breakdown for the FY (only PAID, active payments with tax applied).
   */
  async getAnnualTaxBreakdown(user: IAuthUser, franchiseId: number | undefined, fyStartYear: number): Promise<IAnnualTaxBreakdown> {
    const context = await this.getFranchiseContext(user, franchiseId);
    const fy = this.findOrBuildFy(context, fyStartYear);
    const startDate = new Date(fy.startDate);
    const endDate = new Date(fy.endDate);
    const franchiseScope = this.buildFranchiseScopeWhere(franchiseId, user);

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

    const taxRows = this.buildMonthSequence(context.fyStartMonth, fyStartYear).map<IAnnualTaxRow>(
      ({ monthIndex, monthLabel, ymKey }) => {
        const agg = map.get(ymKey);
        return {
          monthIndex,
          monthLabel,
          taxableAmount: agg?.taxable ?? 0,
          taxAmount: agg?.tax ?? 0,
          totalAmount: agg?.total ?? 0,
        };
      },
    );

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
    const fy = this.findOrBuildFy(context, fyStartYear);
    const startDate = new Date(fy.startDate);
    const endDate = new Date(fy.endDate);
    const franchiseScope = this.buildFranchiseScopeWhere(franchiseId, user);

    const valueExpr =
      mode === 'revenue'
        ? Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('total_amount')), 0)
        : Sequelize.fn('COUNT', Sequelize.col('member_payment_id'));

    const aggregatedRows = await this.paymentRepository.findAll({
      attributes: [
        'programPlanId',
        [valueExpr, 'value'],
      ],
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

  private async resolveFranchise(user: IAuthUser, franchiseId?: number): Promise<MstFranchise> {
    const scoped = user.franchiseIds && user.franchiseIds.length > 0;

    if (franchiseId !== undefined && franchiseId !== null) {
      if (scoped && !user.franchiseIds.includes(franchiseId)) {
        throw new ForbiddenException('You do not have access to this franchise.');
      }
      const found = await this.franchiseRepository.findOne({
        where: { franchiseId, active: true },
      });
      if (!found) throw new NotFoundException('Franchise not found.');
      return found;
    }

    if (scoped) {
      const own = await this.franchiseRepository.findOne({
        where: { franchiseId: { [Op.in]: user.franchiseIds }, active: true },
        order: [['isPrimary', 'DESC'], ['franchiseId', 'ASC']],
      });
      if (!own) throw new NotFoundException('Your assigned franchise was not found.');
      return own;
    }

    const primary = await this.franchiseRepository.findOne({
      where: { active: true },
      order: [['isPrimary', 'DESC'], ['isDefault', 'DESC'], ['franchiseId', 'ASC']],
    });
    if (!primary) throw new NotFoundException('No franchise configured.');
    return primary;
  }

  private buildFranchiseScopeWhere(franchiseId: number | undefined, user: IAuthUser): Record<string, unknown> {
    if (franchiseId !== undefined && franchiseId !== null) {
      return { franchiseId };
    }
    if (user.franchiseIds && user.franchiseIds.length > 0) {
      return { franchiseId: { [Op.in]: user.franchiseIds } };
    }
    return {};
  }

  private normaliseFyStartMonth(raw: number | null | undefined): number {
    if (!raw || raw < 1 || raw > 12) return 1;
    return raw;
  }

  private async buildAvailableYears(franchiseId: number, fyStartMonth: number): Promise<IFinancialYearOption[]> {
    const earliest = await this.memberRepository.findOne({
      where: { franchiseId },
      attributes: [[Sequelize.fn('MIN', Sequelize.col('created_at')), 'earliest']],
      raw: true,
    });
    const earliestDate = (earliest as unknown as { earliest: Date | null })?.earliest;
    const startCalendarYear = earliestDate ? moment(earliestDate).year() : moment().year();
    const startFyYear = this.calendarToFyStartYear(startCalendarYear, fyStartMonth, earliestDate ?? new Date());

    const todayFyStart = this.calendarToFyStartYear(moment().year(), fyStartMonth, new Date());

    const out: IFinancialYearOption[] = [];
    for (let y = todayFyStart; y >= startFyYear; y--) {
      out.push(this.buildFyOption(y, fyStartMonth));
    }
    return out;
  }

  private calendarToFyStartYear(calendarYear: number, fyStartMonth: number, asOf: Date): number {
    if (fyStartMonth === 1) return calendarYear;
    const month = moment(asOf).month() + 1; // 1-12
    return month >= fyStartMonth ? moment(asOf).year() : moment(asOf).year() - 1;
  }

  private buildFyOption(fyStartYear: number, fyStartMonth: number): IFinancialYearOption {
    const start = moment({ year: fyStartYear, month: fyStartMonth - 1, day: 1 }).startOf('day');
    const end = start.clone().add(1, 'year').subtract(1, 'day').endOf('day');

    let label: string;
    if (fyStartMonth === 1) {
      label = `FY-${fyStartYear}`;
    } else {
      const endYy = (fyStartYear + 1) % 100;
      const startYy = fyStartYear % 100;
      label = `FY ${String(startYy).padStart(2, '0')}-${String(endYy).padStart(2, '0')}`;
    }

    return {
      fyStartYear,
      label,
      startDate: start.toDate().toISOString(),
      endDate: end.toDate().toISOString(),
    };
  }

  private findOrBuildFy(context: IAnnualFranchiseContext, fyStartYear: number): IFinancialYearOption {
    const found = context.availableYears.find((y) => y.fyStartYear === fyStartYear);
    if (found) return found;
    if (!Number.isInteger(fyStartYear) || fyStartYear < 2000 || fyStartYear > 2100) {
      throw new BadRequestException('Invalid financial year.');
    }
    return this.buildFyOption(fyStartYear, context.fyStartMonth);
  }

  private buildMonthSequence(
    fyStartMonth: number,
    fyStartYear: number,
  ): Array<{ monthIndex: number; monthLabel: string; ymKey: string }> {
    const seq: Array<{ monthIndex: number; monthLabel: string; ymKey: string }> = [];
    for (let i = 0; i < 12; i++) {
      const m = moment({ year: fyStartYear, month: fyStartMonth - 1, day: 1 }).add(i, 'month');
      seq.push({
        monthIndex: m.month() + 1,
        monthLabel: m.format('MMM'),
        ymKey: m.format('YYYY-MM'),
      });
    }
    return seq;
  }

  private toMonthMap(rows: Array<{ month: string | Date; count: string | number }>): Map<string, number> {
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = moment(r.month).format('YYYY-MM');
      map.set(key, Number(r.count) || 0);
    }
    return map;
  }
}
