import { ExchangeRateService } from '@server_1/modules/tax-engine';
import { Transaction } from 'sequelize';
import {
  AddressService,
  CountryService,
  FranchiseDateUtil,
  InvoiceSequenceModel,
  InvoiceSequenceService,
  InvoiceSeriesUtil,
} from '@server_1/platform';
import { FranchiseService } from '@server_1/modules/franchise';
import { BusinessTypeEnum, InvoiceSeriesEnum } from '@eatfit247-shared-lib';
import { InvoiceIssueService } from '../services/invoice-issue.service';
import { TxnMemberPayment } from '../models/txn-member-payment.model';

describe('FranchiseDateUtil', () => {
  it('takes the calendar day in the franchise timezone across the UTC/IST midnight', () => {
    // 2026-03-31 19:00 UTC is already 1 April 00:30 in India, still 31 March 23:00 in Dubai
    const instant = new Date('2026-03-31T19:00:00Z');
    expect(FranchiseDateUtil.localDate(instant, 'Asia/Kolkata')).toBe('2026-04-01');
    expect(FranchiseDateUtil.localDate(instant, 'Asia/Dubai')).toBe('2026-03-31');
    expect(FranchiseDateUtil.localDate(instant, null)).toBe('2026-04-01');
  });

  it.each([
    ['2026-03-31', 4, '2025-26'],
    ['2026-04-01', 4, '2026-27'],
    ['2027-03-31', 4, '2026-27'],
    ['2026-12-31', 1, '2026'],
    ['2027-01-01', 1, '2027'],
  ])('%s with FY start month %i is FY %s', (date, startMonth, fy) => {
    expect(FranchiseDateUtil.financialYear(date, startMonth)).toBe(fy);
  });

  it('builds a calendar date that formats as the same day in any server timezone', () => {
    const date = FranchiseDateUtil.calendarDate('2026-10-10');
    expect(date.toISOString()).toBe('2026-10-10T12:00:00.000Z');
  });
});

describe('InvoiceSeriesUtil.resolve (decision 1)', () => {
  it.each([
    ['IN', 'US', 0, InvoiceSeriesEnum.EXPORT],
    ['IN', 'us ', '0.00', InvoiceSeriesEnum.EXPORT],
    ['IN', 'US', 180, InvoiceSeriesEnum.DOMESTIC],
    ['IN', 'IN', 0, InvoiceSeriesEnum.DOMESTIC],
    ['IN', null, 0, InvoiceSeriesEnum.DOMESTIC],
    ['AE', 'US', 0, InvoiceSeriesEnum.DOMESTIC],
    ['AE', 'AE', 0, InvoiceSeriesEnum.DOMESTIC],
    [null, 'US', 0, InvoiceSeriesEnum.DOMESTIC],
  ])('franchise %s, billing %s, tax %s → %s', (franchiseCountryCode, billingCountryCode, taxAmount, expected) => {
    expect(
      InvoiceSeriesUtil.resolve({
        franchiseCountryCode: franchiseCountryCode as string | null,
        billingCountryCode: billingCountryCode as string | null,
        taxAmount,
      }),
    ).toBe(expected);
  });

  it.each([
    ['export of service under LUT', 'IN', 'US', 0, ['EXPORT_OF_SERVICE'], InvoiceSeriesEnum.EXPORT],
    ['export with IGST paid (no LUT)', 'IN', 'US', 180, ['EXPORT_OF_SERVICE'], InvoiceSeriesEnum.EXPORT],
    ['export of goods, every line', 'IN', 'US', 0, ['EXPORT_OF_GOODS', 'EXPORT_OF_GOODS'], InvoiceSeriesEnum.EXPORT],
    ['foreign client paying INR (IGST, not export)', 'IN', 'US', 180, ['DOMESTIC_GST'], InvoiceSeriesEnum.DOMESTIC],
    ['foreign client, legacy NO_TAX (pre-4.6)', 'IN', 'US', 0, ['NO_TAX'], InvoiceSeriesEnum.EXPORT],
    ['UAE franchise zero-rated export', 'AE', 'US', 0, ['VAT'], InvoiceSeriesEnum.DOMESTIC],
  ])('4.6 rule: %s', (_label, franchiseCountryCode, billingCountryCode, taxAmount, taxModes, expected) => {
    expect(
      InvoiceSeriesUtil.resolve({
        franchiseCountryCode: franchiseCountryCode as string,
        billingCountryCode: billingCountryCode as string,
        taxAmount: taxAmount as number,
        taxModes: taxModes as string[],
      }),
    ).toBe(expected);
  });

  it('4.6 rule: refuses a product order whose lines disagree on export', () => {
    expect(() =>
      InvoiceSeriesUtil.resolve({
        franchiseCountryCode: 'IN',
        billingCountryCode: 'US',
        taxAmount: 0,
        taxModes: ['EXPORT_OF_GOODS', 'DOMESTIC_GST'],
      }),
    ).toThrow('order lines disagree');
  });

  it('reads the billing address of the snapshot, else the address', () => {
    expect(
      InvoiceSeriesUtil.snapshotCountry({
        address: { countryCode: 'IN' } as never,
        billingAddress: { countryCode: 'US', countryId: 5, country: 'United States' } as never,
      }),
    ).toEqual({ countryCode: 'US', countryId: 5, country: 'United States' });
    expect(InvoiceSeriesUtil.snapshotCountry({ address: { countryCode: 'ae' } as never, billingAddress: null }).countryCode).toBe(
      'AE',
    );
    expect(InvoiceSeriesUtil.snapshotCountry(null)).toEqual({ countryCode: null, countryId: null, country: null });
  });
});

describe('InvoiceSequenceService', () => {
  const trx = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;

  const serviceWith = (currentNumber: number) => {
    const sequence = { currentNumber, save: jest.fn().mockResolvedValue(undefined) };
    const findOrCreate = jest.fn().mockResolvedValue([sequence, false]);
    const service = new InvoiceSequenceService({ findOrCreate } as unknown as typeof InvoiceSequenceModel);
    return { service, findOrCreate, sequence };
  };

  it('numbers the domestic series unchanged and locks the counter row keyed by series', async () => {
    const { service, findOrCreate } = serviceWith(9);
    const issued = await service.generateInvoiceNumber(
      {
        franchiseId: 1,
        franchiseCode: 'EFMUM',
        fyStartMonth: 4,
        invoiceType: BusinessTypeEnum.SERVICE,
        series: InvoiceSeriesEnum.DOMESTIC,
        invoiceDate: '2026-10-12',
      },
      trx,
    );

    expect(issued).toEqual({ invoiceId: 'EFMUM/2026-27/S/000010', invoiceSeries: 'DOMESTIC', invoiceDate: '2026-10-12' });
    expect(findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { franchiseId: 1, invoiceType: BusinessTypeEnum.SERVICE, financialYear: '2026-27', series: 'DOMESTIC' },
        lock: 'UPDATE',
        transaction: trx,
      }),
    );
  });

  it('numbers exports as {code}/EXP/{FY}/{S|P}/{seq} with their own counter', async () => {
    const { service, findOrCreate } = serviceWith(0);
    const issued = await service.generateInvoiceNumber(
      {
        franchiseId: 3,
        franchiseCode: 'MEMUM',
        fyStartMonth: 4,
        invoiceType: BusinessTypeEnum.PRODUCT,
        series: InvoiceSeriesEnum.EXPORT,
        invoiceDate: '2027-03-31',
      },
      trx,
    );

    expect(issued.invoiceId).toBe('MEMUM/EXP/2026-27/P/000001');
    expect(findOrCreate.mock.calls[0][0].where.series).toBe('EXPORT');
  });

  it('takes the FY from the invoice date: 1 April starts the new Indian FY, 1 January the UAE one', async () => {
    const india = serviceWith(0);
    const april = await india.service.generateInvoiceNumber(
      {
        franchiseId: 1,
        franchiseCode: 'EFMUM',
        fyStartMonth: 4,
        invoiceType: BusinessTypeEnum.SERVICE,
        series: InvoiceSeriesEnum.DOMESTIC,
        invoiceDate: '2027-04-01',
      },
      trx,
    );
    expect(april.invoiceId).toBe('EFMUM/2027-28/S/000001');

    const uae = serviceWith(0);
    const january = await uae.service.generateInvoiceNumber(
      {
        franchiseId: 2,
        franchiseCode: 'HCUAE',
        fyStartMonth: 1,
        invoiceType: BusinessTypeEnum.SERVICE,
        series: InvoiceSeriesEnum.DOMESTIC,
        invoiceDate: '2027-01-01',
      },
      trx,
    );
    expect(january.invoiceId).toBe('HCUAE/2027/S/000001');
  });
});

describe('InvoiceSequenceService with a franchise template (compliant invoice numbering)', () => {
  const trx = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;
  const EFM = { franchiseId: 1, franchiseCode: 'EFMUM', invoicePrefix: 'EFM', invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ5}', gstLimit: true };

  const serviceWith = (currentNumber: number) => {
    const sequence = { currentNumber, save: jest.fn().mockResolvedValue(undefined) };
    const findOrCreate = jest.fn().mockResolvedValue([sequence, false]);
    const service = new InvoiceSequenceService({ findOrCreate } as unknown as typeof InvoiceSequenceModel);
    return { service, findOrCreate, sequence };
  };

  it('continues EFMUM\'s counter: after 491 the next domestic service number is EFM/2627/S/00492', async () => {
    const { service, findOrCreate, sequence } = serviceWith(491);
    const issued = await service.generateInvoiceNumber(
      { ...EFM, fyStartMonth: 4, invoiceType: BusinessTypeEnum.SERVICE, series: InvoiceSeriesEnum.DOMESTIC, invoiceDate: '2026-10-18' },
      trx,
    );
    expect(issued).toEqual({ invoiceId: 'EFM/2627/S/00492', invoiceSeries: 'DOMESTIC', invoiceDate: '2026-10-18' });
    // Same counter key as the legacy format (decision 5)
    expect(findOrCreate.mock.calls[0][0].where).toEqual({
      franchiseId: 1,
      invoiceType: BusinessTypeEnum.SERVICE,
      financialYear: '2026-27',
      series: 'DOMESTIC',
    });
    expect(findOrCreate.mock.calls[0][0].lock).toBe('UPDATE');
    expect(sequence.currentNumber).toBe(492);
    expect(sequence.save).toHaveBeenCalledWith({ transaction: trx });
  });

  it('starts the first export at EFM/2627/E/00001', async () => {
    const { service, findOrCreate } = serviceWith(0);
    const issued = await service.generateInvoiceNumber(
      { ...EFM, fyStartMonth: 4, invoiceType: BusinessTypeEnum.SERVICE, series: InvoiceSeriesEnum.EXPORT, invoiceDate: '2026-10-18' },
      trx,
    );
    expect(issued.invoiceId).toBe('EFM/2627/E/00001');
    expect(findOrCreate.mock.calls[0][0].where.series).toBe('EXPORT');
  });

  it('numbers MEMUM products MEM/2627/P/00065 after 64, and export products with X', async () => {
    const mem = { franchiseId: 3, franchiseCode: 'MEMUM', invoicePrefix: 'MEM', invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ5}', gstLimit: true };
    const domestic = await serviceWith(64).service.generateInvoiceNumber(
      { ...mem, fyStartMonth: 4, invoiceType: BusinessTypeEnum.PRODUCT, series: InvoiceSeriesEnum.DOMESTIC, invoiceDate: '2026-10-18' },
      trx,
    );
    expect(domestic.invoiceId).toBe('MEM/2627/P/00065');
    const exported = await serviceWith(0).service.generateInvoiceNumber(
      { ...mem, fyStartMonth: 4, invoiceType: BusinessTypeEnum.PRODUCT, series: InvoiceSeriesEnum.EXPORT, invoiceDate: '2026-10-18' },
      trx,
    );
    expect(exported.invoiceId).toBe('MEM/2627/X/00001');
  });

  it('keeps HCUAE (no template) on the legacy format: HCUAE/2026/S/000012', async () => {
    const issued = await serviceWith(11).service.generateInvoiceNumber(
      {
        franchiseId: 2,
        franchiseCode: 'HCUAE',
        fyStartMonth: 1,
        invoiceType: BusinessTypeEnum.SERVICE,
        series: InvoiceSeriesEnum.DOMESTIC,
        invoiceDate: '2026-10-18',
        invoicePrefix: null,
        invoiceNumberFormat: null,
        gstLimit: false,
      },
      trx,
    );
    expect(issued.invoiceId).toBe('HCUAE/2026/S/000012');
  });

  it('a template without a prefix falls back to the legacy format (non-Indian franchise)', async () => {
    const issued = await serviceWith(491).service.generateInvoiceNumber(
      { ...EFM, invoicePrefix: null, gstLimit: false, fyStartMonth: 4, invoiceType: BusinessTypeEnum.SERVICE, series: InvoiceSeriesEnum.DOMESTIC, invoiceDate: '2026-10-18' },
      trx,
    );
    expect(issued.invoiceId).toBe('EFMUM/2026-27/S/000492');
  });

  it('group 7: an Indian franchise without a format is refused the 22-character legacy number, and no number is consumed', async () => {
    const { service, sequence } = serviceWith(491);
    jest.spyOn((service as unknown as { logger: { error: () => void } }).logger, 'error').mockImplementation(() => undefined);
    await expect(
      service.generateInvoiceNumber(
        { ...EFM, invoicePrefix: null, invoiceNumberFormat: null, fyStartMonth: 4, invoiceType: BusinessTypeEnum.SERVICE, series: InvoiceSeriesEnum.DOMESTIC, invoiceDate: '2026-10-18' },
        trx,
      ),
    ).rejects.toThrow('EFMUM/2026-27/S/000492 breaks the GST limit of 16 characters');
    expect(sequence.save).not.toHaveBeenCalled();
    expect(sequence.currentNumber).toBe(491);
  });

  it('numbers a credit note with type C from the template, and keeps the legacy CN format without one', async () => {
    const templated = serviceWith(0);
    expect(await templated.service.generateCreditNoteNumber({ ...EFM, fyStartMonth: 4, invoiceDate: '2026-10-18' }, trx)).toBe('EFM/2627/C/00001');
    expect(templated.findOrCreate.mock.calls[0][0].where).toEqual({
      franchiseId: 1,
      invoiceType: 'credit',
      financialYear: '2026-27',
      series: 'DOMESTIC',
    });
    const legacy = serviceWith(3);
    expect(
      await legacy.service.generateCreditNoteNumber(
        { franchiseId: 2, franchiseCode: 'HCUAE', fyStartMonth: 1, invoiceDate: '2026-10-18' },
        trx,
      ),
    ).toBe('HCUAE/2026/CN/000004');
  });

  it('guard (decision 7): a number over 16 characters for an Indian franchise throws and consumes no number', async () => {
    const { service, sequence } = serviceWith(491);
    const errorLog = jest.spyOn((service as unknown as { logger: { error: () => void } }).logger, 'error').mockImplementation(() => undefined);
    await expect(
      service.generateInvoiceNumber(
        { ...EFM, invoicePrefix: 'EFMUM', fyStartMonth: 4, invoiceType: BusinessTypeEnum.SERVICE, series: InvoiceSeriesEnum.DOMESTIC, invoiceDate: '2026-10-18' },
        trx,
      ),
    ).rejects.toThrow('EFMUM/2627/S/00492 breaks the GST limit of 16 characters');
    expect(sequence.currentNumber).toBe(491);
    expect(sequence.save).not.toHaveBeenCalled();
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('Refused invoice number EFMUM/2627/S/00492 for franchise 1'));
  });

  it('guard: the same credit-note render is refused too, and a non-Indian franchise is not held to 16', async () => {
    const india = serviceWith(0);
    jest.spyOn((india.service as unknown as { logger: { error: () => void } }).logger, 'error').mockImplementation(() => undefined);
    await expect(
      india.service.generateCreditNoteNumber({ ...EFM, invoicePrefix: 'EFMUM', fyStartMonth: 4, invoiceDate: '2026-10-18' }, trx),
    ).rejects.toThrow('breaks the GST limit');
    expect(india.sequence.save).not.toHaveBeenCalled();

    const uae = serviceWith(0);
    const issued = await uae.service.generateInvoiceNumber(
      {
        franchiseId: 2,
        franchiseCode: 'HCUAE',
        invoicePrefix: 'HCUAE',
        invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ8}',
        gstLimit: false,
        fyStartMonth: 1,
        invoiceType: BusinessTypeEnum.SERVICE,
        series: InvoiceSeriesEnum.DOMESTIC,
        invoiceDate: '2026-10-18',
      },
      trx,
    );
    expect(issued.invoiceId).toBe('HCUAE/2026/S/00000001');
  });
});

describe('InvoiceIssueService', () => {
  const trx = {} as Transaction;
  let generateInvoiceNumber: jest.Mock;
  let countryFetchById: jest.Mock;
  let countryFindAll: jest.Mock;
  let service: InvoiceIssueService;

  const record = (overrides: Partial<TxnMemberPayment>): TxnMemberPayment =>
    ({ invoiceId: null, taxAmount: 0, memberAddress: null, ...overrides }) as unknown as TxnMemberPayment;

  beforeEach(() => {
    generateInvoiceNumber = jest.fn().mockImplementation(async (request: { series: InvoiceSeriesEnum; invoiceDate: string }) => ({
      invoiceId: request.series === InvoiceSeriesEnum.EXPORT ? 'EFMUM/EXP/2026-27/S/000001' : 'EFMUM/2026-27/S/000010',
      invoiceSeries: request.series,
      invoiceDate: request.invoiceDate,
    }));
    countryFetchById = jest.fn().mockImplementation(async (id: number) => ({ countryCode: id === 101 ? 'IN ' : 'US' }));
    countryFindAll = jest.fn().mockResolvedValue({ tableData: [{ country: 'United States', countryCode: 'US' }], count: 1 });
    service = new InvoiceIssueService(
      { generateInvoiceNumber } as unknown as InvoiceSequenceService,
      {
        fetchById: jest.fn().mockResolvedValue({ financialYear: 4, franchiseCode: 'EFMUM', timeZone: 'Asia/Kolkata' }),
      } as unknown as FranchiseService,
      { filterByTableIdAndPk: jest.fn().mockResolvedValue([{ countryId: 101 }]) } as unknown as AddressService,
      { fetchById: countryFetchById, findAll: countryFindAll } as unknown as CountryService,
      { findRate: jest.fn().mockResolvedValue(null) } as unknown as ExchangeRateService,
    );
  });

  it('issues an EXPORT number for a US client with no tax and sets id, series and local date on the record', async () => {
    const payment = record({ memberAddress: { address: null, billingAddress: { countryCode: 'US' } } as never });

    await service.issue(payment, 'plan', 1, trx, new Date('2026-09-30T19:00:00Z'));

    expect(generateInvoiceNumber.mock.calls[0][0]).toMatchObject({
      franchiseId: 1,
      franchiseCode: 'EFMUM',
      fyStartMonth: 4,
      invoiceType: BusinessTypeEnum.SERVICE,
      series: InvoiceSeriesEnum.EXPORT,
      invoiceDate: '2026-10-01',
    });
    expect(payment).toMatchObject({
      invoiceId: 'EFMUM/EXP/2026-27/S/000001',
      invoiceSeries: InvoiceSeriesEnum.EXPORT,
      invoiceDate: '2026-10-01',
    });
  });

  it('passes the franchise prefix, template and the Indian Rule 46 limit to the sequence service', async () => {
    const withFormat = new InvoiceIssueService(
      { generateInvoiceNumber } as unknown as InvoiceSequenceService,
      {
        fetchById: jest.fn().mockResolvedValue({
          financialYear: 4,
          franchiseCode: 'EFMUM',
          timeZone: 'Asia/Kolkata',
          invoicePrefix: 'EFM',
          invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ5}',
        }),
      } as unknown as FranchiseService,
      { filterByTableIdAndPk: jest.fn().mockResolvedValue([{ countryId: 101 }]) } as unknown as AddressService,
      { fetchById: countryFetchById, findAll: countryFindAll } as unknown as CountryService,
      { findRate: jest.fn().mockResolvedValue(null) } as unknown as ExchangeRateService,
    );
    await withFormat.issue(record({ memberAddress: null }), 'plan', 1, trx);
    expect(generateInvoiceNumber.mock.calls[0][0]).toMatchObject({
      invoicePrefix: 'EFM',
      invoiceNumberFormat: '{PREFIX}/{FY}/{TYPE}/{SEQ5}',
      gstLimit: true,
    });
  });

  it('a non-Indian franchise without a template issues with no format and no 16-character limit', async () => {
    countryFetchById.mockResolvedValue({ countryCode: 'AE' });
    await service.issue(record({ memberAddress: null }), 'plan', 2, trx);
    expect(generateInvoiceNumber.mock.calls[0][0]).toMatchObject({ invoicePrefix: null, invoiceNumberFormat: null, gstLimit: false });
  });

  it('never changes an issued number', async () => {
    const payment = record({ invoiceId: 'EFMUM/2026-27/S/000003' });
    expect(await service.issue(payment, 'plan', 1, trx)).toBeNull();
    expect(generateInvoiceNumber).not.toHaveBeenCalled();
    expect(payment.invoiceId).toBe('EFMUM/2026-27/S/000003');
  });

  it('resolves the billing country from the snapshot code, then its country id, then its name', async () => {
    expect(await service.billingCountryCode({ billingAddress: { countryCode: 'us' } as never })).toBe('US');
    expect(await service.billingCountryCode({ billingAddress: { countryId: 7 } as never })).toBe('US');
    expect(await service.billingCountryCode({ billingAddress: { country: ' United States ' } as never })).toBe('US');
    expect(await service.billingCountryCode({ address: null, billingAddress: null })).toBeNull();
  });

  it('uses the domestic series when the billing country is unknown or tax was charged', async () => {
    await service.issue(record({ memberAddress: null }), 'plan', 1, trx);
    await service.issue(
      record({ taxAmount: 180, memberAddress: { address: null, billingAddress: { countryCode: 'US' } } as never }),
      'product',
      1,
      trx,
    );
    expect(generateInvoiceNumber.mock.calls.map((call) => call[0].series)).toEqual([
      InvoiceSeriesEnum.DOMESTIC,
      InvoiceSeriesEnum.DOMESTIC,
    ]);
    expect(generateInvoiceNumber.mock.calls[1][0].invoiceType).toBe(BusinessTypeEnum.PRODUCT);
  });
});
