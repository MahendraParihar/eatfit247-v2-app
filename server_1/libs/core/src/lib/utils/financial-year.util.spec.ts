import { FinancialYearUtil } from '@eatfit247-shared-lib';

/**
 * FinancialYearUtil lives in shared-library, which has no test runner of its own.
 * It is specced here because libs/core already has a Jest setup that resolves
 * the @eatfit247-shared-lib path alias.
 */
describe('FinancialYearUtil', () => {
  describe('normaliseStartMonth', () => {
    it.each([
      [undefined, 1],
      [null, 1],
      [0, 1],
      [13, 1],
      [1, 1],
      [4, 4],
      [12, 12],
    ])('maps %p to %p', (raw, expected) => {
      expect(FinancialYearUtil.normaliseStartMonth(raw as number)).toBe(expected);
    });
  });

  describe('fyRange', () => {
    it('spans Apr 1 to Mar 31 for an Apr-Mar financial year', () => {
      expect(FinancialYearUtil.fyRange(2025, 4)).toEqual({
        startDate: '2025-04-01',
        endDate: '2026-03-31',
      });
    });

    it('spans the calendar year for a Jan-Dec financial year', () => {
      expect(FinancialYearUtil.fyRange(2025, 1)).toEqual({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      });
    });

    it('handles a leap-year February correctly', () => {
      // FY 2023-24 ends 31 Mar 2024; Feb 2024 has 29 days.
      expect(FinancialYearUtil.fyRange(2023, 4)).toEqual({
        startDate: '2023-04-01',
        endDate: '2024-03-31',
      });
    });
  });

  describe('quarterRange — Apr-Mar financial year (fyStartMonth 4)', () => {
    it.each([
      [1, '2025-04-01', '2025-06-30'],
      [2, '2025-07-01', '2025-09-30'],
      [3, '2025-10-01', '2025-12-31'],
      // Q4 rolls into the next calendar year.
      [4, '2026-01-01', '2026-03-31'],
    ])('Q%i is %s to %s', (quarter, startDate, endDate) => {
      expect(FinancialYearUtil.quarterRange(2025, 4, quarter as 1 | 2 | 3 | 4)).toEqual({
        startDate,
        endDate,
      });
    });
  });

  describe('quarterRange — Jan-Dec financial year (fyStartMonth 1)', () => {
    it.each([
      [1, '2025-01-01', '2025-03-31'],
      [2, '2025-04-01', '2025-06-30'],
      [3, '2025-07-01', '2025-09-30'],
      [4, '2025-10-01', '2025-12-31'],
    ])('Q%i is %s to %s', (quarter, startDate, endDate) => {
      expect(FinancialYearUtil.quarterRange(2025, 1, quarter as 1 | 2 | 3 | 4)).toEqual({
        startDate,
        endDate,
      });
    });
  });

  describe('quarterRange — Jul-Jun financial year (fyStartMonth 7)', () => {
    it.each([
      [1, '2025-07-01', '2025-09-30'],
      [2, '2025-10-01', '2025-12-31'],
      // Q3 and Q4 both roll into the next calendar year.
      [3, '2026-01-01', '2026-03-31'],
      [4, '2026-04-01', '2026-06-30'],
    ])('Q%i is %s to %s', (quarter, startDate, endDate) => {
      expect(FinancialYearUtil.quarterRange(2025, 7, quarter as 1 | 2 | 3 | 4)).toEqual({
        startDate,
        endDate,
      });
    });
  });

  it('quarters tile the financial year exactly, with no gaps or overlaps', () => {
    for (const fyStartMonth of [1, 4, 7, 10, 12]) {
      const fy = FinancialYearUtil.fyRange(2025, fyStartMonth);
      const quarters = [1, 2, 3, 4].map((q) =>
        FinancialYearUtil.quarterRange(2025, fyStartMonth, q as 1 | 2 | 3 | 4),
      );

      expect(quarters[0].startDate).toBe(fy.startDate);
      expect(quarters[3].endDate).toBe(fy.endDate);

      for (let i = 1; i < quarters.length; i++) {
        const previousEnd = new Date(`${quarters[i - 1].endDate}T00:00:00`);
        const currentStart = new Date(`${quarters[i].startDate}T00:00:00`);
        const gapInDays = (currentStart.getTime() - previousEnd.getTime()) / 86_400_000;
        expect(gapInDays).toBe(1);
      }
    }
  });

  describe('fyStartYearFor', () => {
    it('returns the current calendar year once the FY start month is reached', () => {
      expect(FinancialYearUtil.fyStartYearFor(4, new Date(2025, 3, 1))).toBe(2025); // 1 Apr 2025
      expect(FinancialYearUtil.fyStartYearFor(4, new Date(2025, 11, 31))).toBe(2025);
    });

    it('returns the previous calendar year before the FY start month', () => {
      expect(FinancialYearUtil.fyStartYearFor(4, new Date(2025, 2, 31))).toBe(2024); // 31 Mar 2025
    });

    it('always returns the calendar year for a Jan-Dec financial year', () => {
      expect(FinancialYearUtil.fyStartYearFor(1, new Date(2025, 0, 1))).toBe(2025);
      expect(FinancialYearUtil.fyStartYearFor(1, new Date(2025, 11, 31))).toBe(2025);
    });
  });

  describe('quarterFor', () => {
    it('locates the FY quarter for an Apr-Mar year', () => {
      expect(FinancialYearUtil.quarterFor(4, new Date(2025, 3, 15))).toBe(1); // Apr
      expect(FinancialYearUtil.quarterFor(4, new Date(2025, 7, 6))).toBe(2); // Aug
      expect(FinancialYearUtil.quarterFor(4, new Date(2025, 10, 1))).toBe(3); // Nov
      expect(FinancialYearUtil.quarterFor(4, new Date(2026, 1, 14))).toBe(4); // Feb
    });

    it('locates the FY quarter for a Jan-Dec year', () => {
      expect(FinancialYearUtil.quarterFor(1, new Date(2025, 0, 1))).toBe(1);
      expect(FinancialYearUtil.quarterFor(1, new Date(2025, 7, 6))).toBe(3);
      expect(FinancialYearUtil.quarterFor(1, new Date(2025, 11, 31))).toBe(4);
    });
  });

  describe('label', () => {
    it('uses the two-year form for an offset financial year', () => {
      expect(FinancialYearUtil.label(2025, 4)).toBe('FY 25-26');
      expect(FinancialYearUtil.label(2099, 4)).toBe('FY 99-00');
    });

    it('uses the single-year form for a calendar financial year', () => {
      expect(FinancialYearUtil.label(2025, 1)).toBe('FY-2025');
    });
  });

  describe('buildQuarters', () => {
    it('labels quarters by their own months, not calendar quarters', () => {
      expect(FinancialYearUtil.buildQuarters(2025, 4).map((q) => q.label)).toEqual([
        'Q1 (Apr - Jun)',
        'Q2 (Jul - Sep)',
        'Q3 (Oct - Dec)',
        'Q4 (Jan - Mar)',
      ]);
    });

    it('labels a Jan-Dec year starting from January', () => {
      expect(FinancialYearUtil.buildQuarters(2025, 1).map((q) => q.label)).toEqual([
        'Q1 (Jan - Mar)',
        'Q2 (Apr - Jun)',
        'Q3 (Jul - Sep)',
        'Q4 (Oct - Dec)',
      ]);
    });
  });
});
