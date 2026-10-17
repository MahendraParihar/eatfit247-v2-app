import { Sequelize } from 'sequelize-typescript';
import { TableEnum, TurnoverAlertLevel } from '@eatfit247-shared-lib';
import { MstFranchise } from '@server_1/core';
import { FranchiseTurnoverService, ITurnoverFranchise } from './franchise-turnover.service';

describe('FranchiseTurnoverService (turnover warning, decision 12)', () => {
  let query: jest.Mock;
  let service: FranchiseTurnoverService;

  const memum = (overrides: Partial<ITurnoverFranchise> = {}): ITurnoverFranchise =>
    ({
      franchiseId: 3,
      financialYear: 4,
      timeZone: 'Asia/Kolkata',
      gstNumber: null,
      registrationThresholdAmount: '4000000.00',
      ...overrides,
    }) as unknown as ITurnoverFranchise;

  const withTurnover = (total: string | number | null) => query.mockResolvedValue([{ total }]);

  beforeEach(() => {
    query = jest.fn().mockResolvedValue([{ total: '0' }]);
    service = new FranchiseTurnoverService({} as typeof MstFranchise, { query } as unknown as Sequelize);
  });

  describe('financialYearRange', () => {
    it.each([
      ['2027-03-31', 4, '2026-27', '2026-04-01', '2027-04-01'],
      ['2027-04-01', 4, '2027-28', '2027-04-01', '2028-04-01'],
      ['2026-10-17', 4, '2026-27', '2026-04-01', '2027-04-01'],
      ['2026-12-31', 1, '2026', '2026-01-01', '2027-01-01'],
      ['2027-01-01', 1, '2027', '2027-01-01', '2028-01-01'],
    ])('%s, FY start month %i → %s [%s, %s)', (date, startMonth, fy, from, to) => {
      expect(FranchiseTurnoverService.financialYearRange(date, startMonth)).toEqual({ financialYear: fy, from, to });
    });
  });

  it('FY boundary in IST: 23:59 on 31 March is still FY 2026-27, midnight starts FY 2027-28', async () => {
    await service.forFranchise(memum(), new Date('2027-03-31T18:29:00Z'));
    expect(query.mock.calls[0][1].replacements).toEqual({
      franchiseId: 3,
      from: '2026-04-01',
      to: '2027-04-01',
      timeZone: 'Asia/Kolkata',
      franchiseTable: TableEnum.MST_FRANCHISES,
    });
    const next = await service.forFranchise(memum(), new Date('2027-03-31T18:30:00Z'));
    expect(next.financialYear).toBe('2027-28');
    expect(query.mock.calls[1][1].replacements).toMatchObject({ from: '2027-04-01', to: '2028-04-01' });
  });

  it.each([
    [3_199_600, 79.99, TurnoverAlertLevel.NONE],
    [3_199_999.99, 80, TurnoverAlertLevel.NONE],
    [3_200_000, 80, TurnoverAlertLevel.AMBER],
    // Shown as 100.00% but still below the threshold: amber, not red
    [3_999_999.99, 100, TurnoverAlertLevel.AMBER],
    [3_999_000, 99.98, TurnoverAlertLevel.AMBER],
    [4_000_000, 100, TurnoverAlertLevel.RED],
    [4_800_000, 120, TurnoverAlertLevel.RED],
  ])('turnover %d of ₹40 lakh → %d%% → level %d', async (total, percent, level) => {
    withTurnover(String(total));
    expect(await service.forFranchise(memum(), new Date('2026-10-17T06:00:00Z'))).toEqual({
      financialYear: '2026-27',
      turnover: total,
      threshold: 4_000_000,
      percent,
      level,
      fxPendingCount: 0,
    });
  });

  it('a franchise with a GSTIN shows no warning, whatever its turnover', async () => {
    withTurnover('4800000');
    const result = await service.forFranchise(memum({ gstNumber: '27AAAAA0000A1Z5' }));
    expect(result.level).toBe(TurnoverAlertLevel.NONE);
    expect(result.percent).toBe(120);
  });

  it('no threshold: no percent and no warning', async () => {
    withTurnover('4800000');
    expect(await service.forFranchise(memum({ registrationThresholdAmount: null as unknown as number }))).toMatchObject({
      threshold: null,
      percent: null,
      level: TurnoverAlertLevel.NONE,
    });
  });

  it('group 7: an FX-pending row in another currency is left out of turnover and counted separately', async () => {
    query.mockResolvedValue([{ total: '79900', pending: '2' }]);
    expect(await service.forFranchise(memum())).toMatchObject({ turnover: 79900, fxPendingCount: 2 });
    const sql = query.mock.calls[0][0] as string;
    // Counted: functional amount known, or already in the franchise's currency (its country's currency_code)
    expect(sql).toContain('t.functional_total_amount IS NOT NULL');
    expect(sql).toContain('upper(trim(t.currency)) = (SELECT currency FROM fc)');
    expect(sql).toContain('JOIN public.mst_countries c ON c.country_id = a.country_id');
    expect(sql).toContain('SUM(amount) FILTER (WHERE counted)');
  });

  it('sums functional amounts, else the invoice amount of a same-currency row, dated by payment date for rows before 137', async () => {
    withTurnover(null);
    expect((await service.forFranchise(memum())).turnover).toBe(0);
    const sql = query.mock.calls[0][0] as string;
    expect(sql).toContain('COALESCE(t.functional_total_amount, t.total_amount)');
    expect(sql).toContain('COALESCE(p.invoice_date, p.payment_date)');
    expect(sql).toContain('COALESCE(m.invoice_date, (m.payment_date AT TIME ZONE :timeZone)::date)');
    expect(sql.match(/invoice_id IS NOT NULL/g)).toHaveLength(2);
  });
});
