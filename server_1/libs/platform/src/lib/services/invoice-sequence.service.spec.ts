import { Transaction } from 'sequelize';
import { BusinessTypeEnum } from '@eatfit247-shared-lib';
import { InvoiceSequenceModel } from '../database/models';
import { InvoiceSequenceService } from './invoice-sequence.service';

type CounterRow = { currentNumber: number; save: jest.Mock };

/** One shared counter row, as the DB would hand back under FOR UPDATE. */
const setup = (startAt = 0) => {
  const rows = new Map<string, CounterRow>();
  const findOrCreate = jest.fn(
    async (options: { where: { franchiseId: number; invoiceType: string; financialYear: string } }) => {
      const key = `${options.where.franchiseId}|${options.where.invoiceType}|${options.where.financialYear}`;
      if (!rows.has(key)) {
        rows.set(key, { currentNumber: startAt, save: jest.fn() });
      }
      return [rows.get(key), false];
    },
  );
  const model = { findOrCreate } as unknown as typeof InvoiceSequenceModel;
  const trx = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;
  return { service: new InvoiceSequenceService(model), findOrCreate, rows, trx };
};

describe('InvoiceSequenceService.generateInvoiceNumber', () => {
  afterEach(() => jest.useRealTimers());

  describe('FY from the invoice date (April-March franchise)', () => {
    it.each([
      ['2026-03-31', 'EFMUM/2025-26/S/000001'],
      ['2026-04-01', 'EFMUM/2026-27/S/000001'],
      ['2026-08-11', 'EFMUM/2026-27/S/000001'],
    ])('%s → %s', async (invoiceDate, expected) => {
      const { service, trx } = setup();
      await expect(
        service.generateInvoiceNumber(1, 4, 'EFMUM', BusinessTypeEnum.SERVICE, trx, invoiceDate),
      ).resolves.toBe(expected);
    });

    it('uses the invoice date, not today, when both are given', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2027, 3, 2)); // 2 Apr 2027 → FY 2027-28
      const { service, trx, findOrCreate } = setup();
      await expect(
        service.generateInvoiceNumber(1, 4, 'EFMUM', BusinessTypeEnum.SERVICE, trx, '2027-03-31'),
      ).resolves.toBe('EFMUM/2026-27/S/000001');
      expect(findOrCreate.mock.calls[0][0].where.financialYear).toBe('2026-27');
    });
  });

  describe('FY from the invoice date (January-December franchise)', () => {
    it.each([
      ['2025-12-31', 'HCUAE/2025/S/000001'],
      ['2026-01-01', 'HCUAE/2026/S/000001'],
    ])('%s → %s', async (invoiceDate, expected) => {
      const { service, trx } = setup();
      await expect(
        service.generateInvoiceNumber(2, 1, 'HCUAE', BusinessTypeEnum.SERVICE, trx, invoiceDate),
      ).resolves.toBe(expected);
    });
  });

  it('defaults to today when no invoice date is given (member and product callers)', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 26)); // 26 Oct 2026
    const { service, trx } = setup();
    await expect(
      service.generateInvoiceNumber(1, 4, 'EFMUM', BusinessTypeEnum.SERVICE, trx),
    ).resolves.toBe('EFMUM/2026-27/S/000001');
    jest.setSystemTime(new Date(2027, 2, 31)); // 31 Mar 2027, still FY 2026-27
    await expect(
      service.generateInvoiceNumber(1, 4, 'EFMUM', BusinessTypeEnum.PRODUCT, trx),
    ).resolves.toBe('EFMUM/2026-27/P/000001');
  });

  it('issues consecutive numbers on the same counter row, under a row lock', async () => {
    const { service, trx, findOrCreate, rows } = setup(491);
    const first = await service.generateInvoiceNumber(1, 4, 'EFMUM', BusinessTypeEnum.SERVICE, trx, '2026-10-26');
    const second = await service.generateInvoiceNumber(1, 4, 'EFMUM', BusinessTypeEnum.SERVICE, trx);
    expect([first, second]).toEqual(['EFMUM/2026-27/S/000492', 'EFMUM/2026-27/S/000493']);
    // The workshop path (date given) and the member path (no date) share one counter row.
    expect(rows.size).toBe(1);
    const row = [...rows.values()][0];
    expect(row.currentNumber).toBe(493);
    expect(row.save).toHaveBeenCalledTimes(2);
    expect(row.save).toHaveBeenCalledWith({ transaction: trx });
    for (const [options] of findOrCreate.mock.calls) {
      expect(options.where).toEqual({ franchiseId: 1, invoiceType: 'service', financialYear: '2026-27' });
      expect(options.lock).toBe('UPDATE');
      expect(options.transaction).toBe(trx);
    }
  });

  it('rejects a malformed invoice date before touching the counter', async () => {
    const { service, trx, findOrCreate } = setup();
    await expect(
      service.generateInvoiceNumber(1, 4, 'EFMUM', BusinessTypeEnum.SERVICE, trx, '11/08/2026'),
    ).rejects.toThrow('Invalid invoice date');
    expect(findOrCreate).not.toHaveBeenCalled();
  });
});

describe('InvoiceSequenceService.financialYearFor', () => {
  const { service } = setup();
  it.each([
    ['2026-03-31', 4, '2025-26'],
    ['2026-04-01', 4, '2026-27'],
    ['2026-12-31', 1, '2026'],
  ])('%s with start month %i → %s', (date, startMonth, expected) => {
    expect(service.financialYearFor(date, startMonth)).toBe(expected);
  });
});
