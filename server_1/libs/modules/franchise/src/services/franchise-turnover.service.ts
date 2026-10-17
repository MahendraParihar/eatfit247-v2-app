import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { IFranchiseTurnover, TurnoverAlertLevel } from '@eatfit247-shared-lib';
import { MstFranchise } from '@server_1/core';
import { FranchiseDateUtil } from '@server_1/platform';

/** Share of the threshold at which the warning turns amber, and red (decision 12). */
export const TURNOVER_AMBER_PERCENT = 80;
export const TURNOVER_RED_PERCENT = 100;

/** The franchise columns the turnover check reads. */
export type ITurnoverFranchise = Pick<
  MstFranchise,
  'franchiseId' | 'financialYear' | 'timeZone' | 'gstNumber' | 'registrationThresholdAmount'
>;

/** A financial year as a label and a half-open date range `[from, to)`. */
export interface IFinancialYearRange {
  financialYear: string;
  from: string;
  to: string;
}

/**
 * Registration-threshold warning for a franchise without a GSTIN (compliant invoice numbering,
 * decision 12). FY turnover is the platform's issued plan payments and product orders; GST
 * registration counts all supplies under the PAN (CGST s.22), so this is a lower bound.
 */
@Injectable()
export class FranchiseTurnoverService {
  constructor(
    @InjectModel(MstFranchise) private readonly franchiseRepository: typeof MstFranchise,
    private readonly sequelize: Sequelize,
  ) {}

  public async forFranchiseId(franchiseId: number, asOf: Date = new Date()): Promise<IFranchiseTurnover> {
    const franchise = await this.franchiseRepository.findOne({
      attributes: ['franchiseId', 'financialYear', 'timeZone', 'gstNumber', 'registrationThresholdAmount'],
      where: { franchiseId },
      raw: true,
    });
    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }
    return this.forFranchise(franchise, asOf);
  }

  public async forFranchise(franchise: ITurnoverFranchise, asOf: Date = new Date()): Promise<IFranchiseTurnover> {
    const timeZone = franchise.timeZone || FranchiseDateUtil.DEFAULT_TIME_ZONE;
    const range = FranchiseTurnoverService.financialYearRange(
      FranchiseDateUtil.localDate(asOf, timeZone),
      Number(franchise.financialYear),
    );
    const turnover = await this.turnoverBetween(franchise.franchiseId, range, timeZone);
    const threshold = FranchiseTurnoverService.positiveOrNull(franchise.registrationThresholdAmount);
    // The level uses the exact share; only the shown percent is rounded (99.9999% must not read as red)
    const exactPercent = threshold ? (turnover / threshold) * 100 : null;
    const hasGstin = !!(franchise.gstNumber || '').trim();
    return {
      financialYear: range.financialYear,
      turnover,
      threshold,
      percent: exactPercent === null ? null : Math.round(exactPercent * 100) / 100,
      level: hasGstin ? TurnoverAlertLevel.NONE : FranchiseTurnoverService.levelFor(exactPercent),
    };
  }

  public static levelFor(percent: number | null): TurnoverAlertLevel {
    if (percent === null) {
      return TurnoverAlertLevel.NONE;
    }
    if (percent >= TURNOVER_RED_PERCENT) {
      return TurnoverAlertLevel.RED;
    }
    return percent >= TURNOVER_AMBER_PERCENT ? TurnoverAlertLevel.AMBER : TurnoverAlertLevel.NONE;
  }

  /** The FY containing `localDate` (`YYYY-MM-DD`), e.g. `2026-27` = [2026-04-01, 2027-04-01). */
  public static financialYearRange(localDate: string, fyStartMonth: number): IFinancialYearRange {
    const startMonth = fyStartMonth >= 1 && fyStartMonth <= 12 ? fyStartMonth : 1;
    const [yearText, monthText] = localDate.split('-');
    const startYear = Number(monthText) >= startMonth ? Number(yearText) : Number(yearText) - 1;
    const month = String(startMonth).padStart(2, '0');
    return {
      financialYear: FranchiseDateUtil.financialYear(localDate, startMonth),
      from: `${startYear}-${month}-01`,
      to: `${startYear + 1}-${month}-01`,
    };
  }

  /**
   * Issued plan payments and product orders dated in the range, in the functional currency (else
   * the invoice amount for an FX-pending row). Rows issued before migration 137 have no
   * invoice_date and use their payment date; a product's payment timestamp is read in the
   * franchise's timezone.
   */
  public async turnoverBetween(franchiseId: number, range: IFinancialYearRange, timeZone: string): Promise<number> {
    const [row] = await this.sequelize.query<{ total: string | number | null }>(
      `SELECT COALESCE(SUM(COALESCE(t.functional_total_amount, t.total_amount)), 0) AS total
       FROM (
           SELECT p.functional_total_amount, p.total_amount
           FROM public.txn_member_payments p
           WHERE p.franchise_id = :franchiseId
             AND p.invoice_id IS NOT NULL
             AND COALESCE(p.invoice_date, p.payment_date) >= CAST(:from AS DATE)
             AND COALESCE(p.invoice_date, p.payment_date) < CAST(:to AS DATE)
           UNION ALL
           SELECT m.functional_total_amount, m.total_amount
           FROM public.txn_member_products m
           WHERE m.franchise_id = :franchiseId
             AND m.invoice_id IS NOT NULL
             AND COALESCE(m.invoice_date, (m.payment_date AT TIME ZONE :timeZone)::date) >= CAST(:from AS DATE)
             AND COALESCE(m.invoice_date, (m.payment_date AT TIME ZONE :timeZone)::date) < CAST(:to AS DATE)
       ) t`,
      {
        type: QueryTypes.SELECT,
        replacements: { franchiseId, from: range.from, to: range.to, timeZone },
      },
    );
    return Math.round(Number(row?.total || 0) * 100) / 100;
  }

  private static positiveOrNull(value: number | string | null | undefined): number | null {
    const amount = Number(value ?? 0);
    return amount > 0 ? amount : null;
  }
}
