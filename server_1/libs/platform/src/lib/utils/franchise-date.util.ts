/**
 * Dates in a franchise's own timezone. Invoice dates and the financial year in an invoice number
 * follow the franchise's local calendar day, not the server's or UTC.
 */
export class FranchiseDateUtil {
  public static readonly DEFAULT_TIME_ZONE = 'Asia/Kolkata';

  /** `YYYY-MM-DD` of `date` in the IANA `timeZone` (falls back to Asia/Kolkata). */
  public static localDate(date: Date, timeZone?: string | null): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || FranchiseDateUtil.DEFAULT_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  /**
   * A `Date` for a local calendar day that every server timezone formats as that same day
   * (noon UTC), for writing calendar dates through Sequelize DATE columns.
   */
  public static calendarDate(localDate: string): Date {
    return new Date(`${localDate}T12:00:00.000Z`);
  }

  /**
   * Financial-year label of a local `YYYY-MM-DD` date: `2026-27` for an April start,
   * `2026` for a January start (calendar year).
   */
  public static financialYear(localDate: string, fyStartMonth: number): string {
    const [yearText, monthText] = localDate.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const startYear = month >= fyStartMonth ? year : year - 1;
    return fyStartMonth === 1 ? `${startYear}` : `${startYear}-${String(startYear + 1).slice(-2)}`;
  }
}
