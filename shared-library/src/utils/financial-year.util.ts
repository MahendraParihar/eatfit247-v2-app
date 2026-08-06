import type { FinancialQuarter, IFinancialQuarterOption } from '../core/payment-report.interface';
import type { IFinancialYearOption } from '../core/dashboard-report.interface';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Financial-year and FY-quarter maths, driven by a franchise's configured
 * FY start month (`mst_franchises.financial_year`) rather than a hardcoded April.
 *
 * Pure date arithmetic with no runtime dependencies, so both the NestJS backend
 * and the Angular apps can share it.
 */
export class FinancialYearUtil {
  /** Falls back to a Jan-Dec calendar year when unset or out of range. */
  static normaliseStartMonth(raw: number | null | undefined): number {
    if (!raw || raw < 1 || raw > 12) {
      return 1;
    }
    return raw;
  }

  /** yyyy-MM-dd built from local date parts, matching the admin UI's date formatting. */
  static toDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** The FY start year that `asOf` falls into. */
  static fyStartYearFor(fyStartMonth: number, asOf: Date = new Date()): number {
    const month = FinancialYearUtil.normaliseStartMonth(fyStartMonth);
    if (month === 1) {
      return asOf.getFullYear();
    }
    return asOf.getMonth() + 1 >= month ? asOf.getFullYear() : asOf.getFullYear() - 1;
  }

  /** "FY-2025" for a calendar year, "FY 24-25" for an offset year. */
  static label(fyStartYear: number, fyStartMonth: number): string {
    const month = FinancialYearUtil.normaliseStartMonth(fyStartMonth);
    if (month === 1) {
      return `FY-${fyStartYear}`;
    }
    const startYy = String(fyStartYear % 100).padStart(2, '0');
    const endYy = String((fyStartYear + 1) % 100).padStart(2, '0');
    return `FY ${startYy}-${endYy}`;
  }

  static fyRange(fyStartYear: number, fyStartMonth: number): { startDate: string; endDate: string } {
    const month = FinancialYearUtil.normaliseStartMonth(fyStartMonth);
    const start = new Date(fyStartYear, month - 1, 1);
    // Day 0 of the month following the 12th month is the last day of the FY.
    const end = new Date(fyStartYear, month - 1 + 12, 0);
    return { startDate: FinancialYearUtil.toDateOnly(start), endDate: FinancialYearUtil.toDateOnly(end) };
  }

  /**
   * Quarter of the FINANCIAL year, not the calendar year.
   * fyStartMonth=4, quarter=1 => Apr-Jun.  fyStartMonth=1, quarter=1 => Jan-Mar.
   * fyStartMonth=4, quarter=4 => Jan-Mar of fyStartYear + 1.
   */
  static quarterRange(
    fyStartYear: number,
    fyStartMonth: number,
    quarter: FinancialQuarter,
  ): { startDate: string; endDate: string } {
    const month = FinancialYearUtil.normaliseStartMonth(fyStartMonth);
    const offset = (quarter - 1) * 3;
    // Date rolls month overflow into the following year automatically.
    const start = new Date(fyStartYear, month - 1 + offset, 1);
    const end = new Date(fyStartYear, month - 1 + offset + 3, 0);
    return { startDate: FinancialYearUtil.toDateOnly(start), endDate: FinancialYearUtil.toDateOnly(end) };
  }

  /** Which FY quarter `asOf` falls into. */
  static quarterFor(fyStartMonth: number, asOf: Date = new Date()): FinancialQuarter {
    const month = FinancialYearUtil.normaliseStartMonth(fyStartMonth);
    const monthsSinceFyStart = (asOf.getMonth() + 1 - month + 12) % 12;
    return (Math.floor(monthsSinceFyStart / 3) + 1) as FinancialQuarter;
  }

  static buildQuarters(fyStartYear: number, fyStartMonth: number): IFinancialQuarterOption[] {
    const month = FinancialYearUtil.normaliseStartMonth(fyStartMonth);
    const out: IFinancialQuarterOption[] = [];
    for (let q = 1; q <= 4; q++) {
      const quarter = q as FinancialQuarter;
      const range = FinancialYearUtil.quarterRange(fyStartYear, month, quarter);
      const firstMonth = MONTH_LABELS[(month - 1 + (q - 1) * 3) % 12];
      const lastMonth = MONTH_LABELS[(month - 1 + (q - 1) * 3 + 2) % 12];
      out.push({
        quarter,
        label: `Q${q} (${firstMonth} - ${lastMonth})`,
        startDate: range.startDate,
        endDate: range.endDate,
      });
    }
    return out;
  }

  static buildFyOption(fyStartYear: number, fyStartMonth: number): IFinancialYearOption {
    const range = FinancialYearUtil.fyRange(fyStartYear, fyStartMonth);
    return {
      fyStartYear,
      label: FinancialYearUtil.label(fyStartYear, fyStartMonth),
      startDate: new Date(`${range.startDate}T00:00:00`).toISOString(),
      endDate: new Date(`${range.endDate}T23:59:59.999`).toISOString(),
    };
  }
}
