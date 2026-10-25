import 'reflect-metadata';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { Op, Transaction } from 'sequelize';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  ConfigParam,
  IAuthUser,
  IManageWorkshopInvoice,
  PaymentStatusEnum,
  TaxMode,
  TaxTypeEnum,
} from '@eatfit247-shared-lib';
import { AppConfigService, CaslAbilityFactory } from '@server_1/core';
import {
  AddressService,
  CountryService,
  CurrencyService,
  InvoiceSequenceService,
  PaymentModeService,
  PaymentStatusService,
  StateService,
} from '@server_1/platform';
import {
  IndiaGstService,
  TaxEngineService,
  UsSalesTaxService,
  VatService,
} from '@server_1/modules/tax-engine';
import { FranchiseService } from '@server_1/modules/franchise';
import { TxnWorkshopInvoice } from '../models';
import { ManageWorkshopInvoiceDto } from '../dto';
import { WorkshopInvoiceService } from './workshop-invoice.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const INDIA = 101;
const UAE = 229;
const MAHARASHTRA = 27; // EFMUM is in Maharashtra
const KARNATAKA = 29;
const DUBAI = 4001;
const SAC = '999319';

const countries: Record<number, { countryId: number; country: string; countryCode: string }> = {
  [INDIA]: { countryId: INDIA, country: 'India', countryCode: 'IN' },
  [UAE]: { countryId: UAE, country: 'United Arab Emirates', countryCode: 'AE' },
};
const states: Record<number, { stateId: number; state: string; code: string; countryId: number }> = {
  [MAHARASHTRA]: { stateId: MAHARASHTRA, state: 'Maharashtra', code: '27', countryId: INDIA },
  [KARNATAKA]: { stateId: KARNATAKA, state: 'Karnataka', code: '29', countryId: INDIA },
  [DUBAI]: { stateId: DUBAI, state: 'Dubai', code: 'DU', countryId: UAE },
};
const franchises: Record<number, { franchiseId: number; franchiseCode: string; financialYear: number }> = {
  1: { franchiseId: 1, franchiseCode: 'EFMUM', financialYear: 4 },
  2: { franchiseId: 2, franchiseCode: 'HCUAE', financialYear: 1 },
};

const ALL_ACTIONS = ['read', 'create', 'update', 'delete'];
const user = (franchiseIds: number[], actions: string[] = ALL_ACTIONS): IAuthUser =>
  ({
    adminId: 10,
    emailId: 'qa@eatfit247.test',
    roleKeys: [],
    franchiseIds,
    permissions: actions.length ? { [AdminSubjectEnum.WorkshopInvoice]: actions } : { [AdminSubjectEnum.Blog]: ['read'] },
    subjectMeta: { [AdminSubjectEnum.WorkshopInvoice]: { franchiseScoped: true } },
  }) as IAuthUser;
const financialManager = user([1]);
const hcuaeOnly = user([2]);
const superAdmin = user([]);
const noPermission = user([1], []);

const payload = (over: Partial<IManageWorkshopInvoice> = {}): IManageWorkshopInvoice => ({
  franchiseId: 1,
  invoiceDate: '2026-10-26',
  supplyDate: '2026-08-11',
  billToName: '<Organiser legal name>',
  billToContactPerson: null,
  billToEmail: null,
  billToPhone: null,
  billToGstin: null,
  billToAddressLine1: '<Address line 1>',
  billToAddressLine2: null,
  billToCity: '<City>',
  billToPinCode: '400001',
  billToCountryId: INDIA,
  billToStateId: MAHARASHTRA,
  placeOfSupplyStateId: null,
  description: 'Gut reset programme workshop',
  quantity: 200,
  unitRate: 850,
  currency: 'INR',
  paymentStatusId: PaymentStatusEnum.PENDING,
  paymentModeId: 3,
  transactionId: 'UTR-0001',
  paymentDate: '2026-08-11',
  notes: null,
  ...over,
});

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

type FakeRow = TxnWorkshopInvoice & { saveError?: Error };

/** One S counter per franchise+FY that only moves when the transaction commits. */
class FakeCounter {
  committed = new Map<string, number>([['1|2026-27', 491]]);
  staged = new Map<Transaction, Map<string, number>>();
  current(key: string): number {
    return this.committed.get(key) ?? 0;
  }
  next(t: Transaction, key: string): number {
    const pending = this.staged.get(t) ?? new Map<string, number>();
    const value = (pending.get(key) ?? this.current(key)) + 1;
    pending.set(key, value);
    this.staged.set(t, pending);
    return value;
  }
  commit(t: Transaction): void {
    for (const [key, value] of this.staged.get(t) ?? []) this.committed.set(key, value);
    this.staged.delete(t);
  }
  rollback(t: Transaction): void {
    this.staged.delete(t);
  }
}

const setup = (latestIssuedDate: string | null = null) => {
  const store = new Map<number, FakeRow>();
  let nextId = 1;
  const listQuery = jest.fn(async (_options: { where: Record<string | symbol, unknown> }) => ({
    rows: [...store.values()],
    count: store.size,
  }));
  const makeRow = (values: Partial<TxnWorkshopInvoice>): FakeRow => {
    const row = { ...values } as FakeRow;
    Object.assign(row, {
      set: (v: Partial<TxnWorkshopInvoice>) => Object.assign(row, v),
      save: jest.fn(async () => {
        if (row.saveError) throw row.saveError;
        return row;
      }),
      get: () => row,
    });
    return row;
  };
  const repository = {
    create: jest.fn(async (values: Partial<TxnWorkshopInvoice>) => {
      const row = makeRow({ ...values, workshopInvoiceId: nextId++, invoiceId: null, sacCode: null });
      store.set(row.workshopInvoiceId, row);
      return row;
    }),
    findByPk: jest.fn(async (id: number) => store.get(id) ?? null),
    findOne: jest.fn(async ({ where }: { where: { workshopInvoiceId: number; active: boolean } }) => {
      const row = store.get(where.workshopInvoiceId);
      return row && row.active === where.active ? row : null;
    }),
    scope: () => ({
      findByPk: async (id: number) => store.get(id) ?? null,
      findAndCountAll: listQuery,
    }),
  };

  const counter = new FakeCounter();
  const sequelize = {
    transaction: jest.fn(async () => {
      const t = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction & { commit: jest.Mock; rollback: jest.Mock };
      t.commit = jest.fn(async () => counter.commit(t));
      t.rollback = jest.fn(async () => counter.rollback(t));
      return t;
    }),
    query: jest.fn(async () => [{ latest: latestIssuedDate }]),
  };

  const realSequence = new InvoiceSequenceService(null as never);
  const sequence = {
    financialYearFor: (date: string, startMonth: number) => realSequence.financialYearFor(date, startMonth),
    generateInvoiceNumber: jest.fn(
      async (franchiseId: number, startMonth: number, code: string, _type: string, t: Transaction, date?: string) => {
        const fy = realSequence.financialYearFor(date as string, startMonth);
        const n = counter.next(t, `${franchiseId}|${fy}`);
        return `${code}/${fy}/S/${String(n).padStart(6, '0')}`;
      },
    ),
  };

  const config: Record<string, string> = {
    [ConfigParam.DIET_SAC_CODE]: SAC,
    [ConfigParam.CALENDAR_TIMEZONE]: 'Asia/Kolkata',
  };
  const appConfig = { getString: jest.fn((key: string) => config[key]) };

  const countryService = {
    fetchById: async (id: number) => countries[id],
    findAll: async () => ({ tableData: Object.values(countries) }),
    getCountryList: async () => [],
  };
  const stateService = { fetchById: async (id: number) => states[id] };
  const addressService = {
    filterByTableIdAndPk: async (_table: number, franchiseId: number) =>
      franchiseId === 1 ? [{ countryId: INDIA, stateId: MAHARASHTRA, pkOfTable: 1 }] : [{ countryId: UAE, stateId: DUBAI }],
  };
  const taxMaster = {
    getApplicableTaxRule: jest.fn(async () => ({
      taxPercent: 18,
      isTaxInclusive: false,
      taxSystem: TaxTypeEnum.GST,
      countryCode: 'IN',
    })),
  };
  const taxEngine = new TaxEngineService(
    new IndiaGstService(),
    {} as VatService,
    {} as UsSalesTaxService,
    countryService as unknown as CountryService,
    taxMaster as unknown as ConstructorParameters<typeof TaxEngineService>[4],
  );
  const franchiseService = {
    fetchById: async (id: number) => franchises[id],
    getFranchiseList: async () => [
      { id: 1, label: 'EatFit247' },
      { id: 2, label: 'HCUAE' },
    ],
  };

  const service = new WorkshopInvoiceService(
    repository as unknown as typeof TxnWorkshopInvoice,
    sequelize as unknown as Sequelize,
    appConfig as unknown as AppConfigService,
    new CaslAbilityFactory(),
    taxEngine,
    sequence as unknown as InvoiceSequenceService,
    addressService as unknown as AddressService,
    countryService as unknown as CountryService,
    stateService as unknown as StateService,
    { getAllCurrencies: async () => [{ currencyCode: 'INR' }] } as unknown as CurrencyService,
    { getDropdownList: async () => [] } as unknown as PaymentModeService,
    { getDropdownList: async () => [] } as unknown as PaymentStatusService,
    franchiseService as unknown as FranchiseService,
  );
  return { service, store, repository, sequence, sequelize, counter, appConfig, config, listQuery };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WorkshopInvoiceService', () => {
  beforeEach(() => {
    // 26 Oct 2026, 10:00 IST
    jest.useFakeTimers({ now: new Date('2026-10-26T04:30:00Z'), doNotFake: ['nextTick', 'setImmediate'] });
  });
  afterEach(() => jest.useRealTimers());

  describe('tax (A1, A2, A11)', () => {
    it.each([
      [200, MAHARASHTRA, { CGST: 15300, SGST: 15300 }, 30600, 200600],
      [200, KARNATAKA, { IGST: 30600 }, 30600, 200600],
      [174, MAHARASHTRA, { CGST: 13311, SGST: 13311 }, 26622, 174522],
      [174, KARNATAKA, { IGST: 26622 }, 26622, 174522],
    ])('%i × ₹850, place of supply %i', async (quantity, posState, split, tax, total) => {
      const { service } = setup();
      const result = await service.calculateTax(
        { franchiseId: 1, billToCountryId: INDIA, billToStateId: posState, quantity, unitRate: 850, currency: 'INR' },
        financialManager,
      );
      expect(result.orderAmount).toBe(quantity * 850);
      expect(result.taxableAmount).toBe(quantity * 850);
      expect(result.taxAmount).toBe(tax);
      expect(result.totalAmount).toBe(total);
      expect(result.taxMode).toBe(TaxMode.DOMESTIC_GST);
      expect(Object.fromEntries(Object.entries(result.taxObj).map(([k, v]) => [k, v.amount]))).toEqual(split);
    });

    it('place of supply overrides the bill-to State (CGST+SGST → IGST)', async () => {
      const { service } = setup();
      const result = await service.calculateTax(
        {
          franchiseId: 1,
          billToCountryId: INDIA,
          billToStateId: MAHARASHTRA,
          placeOfSupplyStateId: KARNATAKA,
          quantity: 174,
          unitRate: 850,
          currency: 'INR',
        },
        financialManager,
      );
      expect(Object.keys(result.taxObj)).toEqual(['IGST']);
    });

    it('splits an odd paisa so CGST + SGST equals the tax amount', async () => {
      const { service } = setup();
      const result = await service.calculateTax(
        { franchiseId: 1, billToCountryId: INDIA, billToStateId: MAHARASHTRA, quantity: 1, unitRate: 0.17, currency: 'INR' },
        financialManager,
      );
      // 0.17 × 18% = 0.0306 → 0.03; halves 0.02 + 0.01
      expect(result.taxAmount).toBe(0.03);
      expect(result.taxObj['CGST'].amount + result.taxObj['SGST'].amount).toBeCloseTo(0.03, 10);
      expect(result.totalAmount).toBe(0.2);
    });

    it('stores the full tax result on the row (A1)', async () => {
      const { service, store } = setup();
      await service.create(payload(), financialManager, '127.0.0.1');
      const row = store.get(1)!;
      expect(row).toMatchObject({
        orderAmount: 170000,
        discountAmount: 0,
        taxAmount: 30600,
        totalAmount: 200600,
        taxType: TaxTypeEnum.GST,
        taxMode: TaxMode.DOMESTIC_GST,
        taxPercentage: 18,
        isLutApplied: false,
        taxObj: { CGST: { amount: 15300, taxPercentage: 9 }, SGST: { amount: 15300, taxPercentage: 9 } },
        placeOfSupplyStateId: MAHARASHTRA,
      });
      expect(row.jurisdiction).toEqual({ entityCountry: 'India', customerCountry: 'India', placeOfSupply: 'India' });
      expect(row.billToAddress).toMatchObject({ state: 'Maharashtra', country: 'India', countryCode: 'IN', pinCode: '400001' });
    });

    it('turns a tax-engine error into a 400 (INR export)', async () => {
      const { service } = setup();
      await expect(
        service.calculateTax(
          { franchiseId: 1, billToCountryId: UAE, billToStateId: DUBAI, quantity: 1, unitRate: 850, currency: 'INR' },
          financialManager,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a bill-to State outside the bill-to country', async () => {
      const { service } = setup();
      await expect(
        service.calculateTax(
          { franchiseId: 1, billToCountryId: INDIA, billToStateId: DUBAI, quantity: 1, unitRate: 850, currency: 'INR' },
          financialManager,
        ),
      ).rejects.toThrow('not in the bill-to country');
    });
  });

  describe('invoice number (A3, A4, A5, A9)', () => {
    it('PENDING gets no number', async () => {
      const { service, sequence } = setup();
      const saved = await service.create(payload(), financialManager, '127.0.0.1');
      expect(saved.invoiceId).toBeNull();
      expect(saved.locked).toBe(false);
      expect(sequence.generateInvoiceNumber).not.toHaveBeenCalled();
    });

    it('the first move to PAID issues the next S number with the invoice date, once', async () => {
      const { service, sequence, counter } = setup();
      await service.create(payload(), financialManager, '127.0.0.1');
      const paid = await service.update(1, payload({ paymentStatusId: PaymentStatusEnum.PAID }), financialManager, '127.0.0.1');
      expect(paid.invoiceId).toBe('EFMUM/2026-27/S/000492');
      expect(sequence.generateInvoiceNumber).toHaveBeenCalledTimes(1);
      expect(sequence.generateInvoiceNumber.mock.calls[0].slice(0, 4)).toEqual([1, 4, 'EFMUM', 'service']);
      expect(sequence.generateInvoiceNumber.mock.calls[0][5]).toBe('2026-10-26');

      // Saving again as PAID (or REFUND) never issues a second number.
      await service.update(1, payload({ paymentStatusId: PaymentStatusEnum.PAID, notes: 'x' }), financialManager, '127.0.0.1');
      const refunded = await service.update(1, payload({ paymentStatusId: PaymentStatusEnum.REFUND }), financialManager, '127.0.0.1');
      expect(refunded.invoiceId).toBe('EFMUM/2026-27/S/000492');
      expect(sequence.generateInvoiceNumber).toHaveBeenCalledTimes(1);
      expect(counter.current('1|2026-27')).toBe(492);
    });

    it('created directly as PAID gets a number', async () => {
      const { service } = setup();
      const saved = await service.create(payload({ paymentStatusId: PaymentStatusEnum.PAID }), financialManager, '127.0.0.1');
      expect(saved.invoiceId).toBe('EFMUM/2026-27/S/000492');
      expect(saved.locked).toBe(true);
    });

    it('a failed save after the number is generated rolls back and leaves the counter unchanged', async () => {
      const { service, store, counter, repository } = setup();
      await service.create(payload(), financialManager, '127.0.0.1');
      repository.findOne.mockImplementationOnce(async () => {
        const row = store.get(1)!;
        // First save (field values) succeeds, the save after numbering fails.
        let calls = 0;
        (row.save as jest.Mock).mockImplementation(async () => {
          calls += 1;
          if (calls === 2) throw new Error('db write failed');
          return row;
        });
        return row;
      });
      await expect(
        service.update(1, payload({ paymentStatusId: PaymentStatusEnum.PAID }), financialManager, '127.0.0.1'),
      ).rejects.toThrow('db write failed');
      expect(counter.current('1|2026-27')).toBe(491);
      expect(counter.staged.size).toBe(0);
    });

    it('a create that fails after numbering rolls back too', async () => {
      const { service, counter, repository } = setup();
      repository.create.mockImplementationOnce(async (values: Partial<TxnWorkshopInvoice>) => {
        const row = { ...values, workshopInvoiceId: 1, save: jest.fn(async () => { throw new Error('boom'); }) };
        return row as unknown as FakeRow;
      });
      await expect(
        service.create(payload({ paymentStatusId: PaymentStatusEnum.PAID }), financialManager, '127.0.0.1'),
      ).rejects.toThrow('boom');
      expect(counter.current('1|2026-27')).toBe(491);
    });

    it('copies the configured SAC to the row at issue, not before', async () => {
      const { service, store, config } = setup();
      await service.create(payload(), financialManager, '127.0.0.1');
      expect(store.get(1)!.sacCode).toBeNull();
      config[ConfigParam.DIET_SAC_CODE] = '999722';
      await service.update(1, payload({ paymentStatusId: PaymentStatusEnum.PAID }), financialManager, '127.0.0.1');
      expect(store.get(1)!.sacCode).toBe('999722');
      // A later config change doesn't touch the issued row.
      config[ConfigParam.DIET_SAC_CODE] = SAC;
      await service.update(1, payload({ paymentStatusId: PaymentStatusEnum.PAID, notes: 'later' }), financialManager, '127.0.0.1');
      expect(store.get(1)!.sacCode).toBe('999722');
    });

    it('cancel keeps the number, and the next invoice takes the next number', async () => {
      const { service } = setup();
      await service.create(payload({ paymentStatusId: PaymentStatusEnum.PAID }), financialManager, '127.0.0.1');
      const cancelled = await service.cancel(1, 'Raised twice', financialManager, '127.0.0.1');
      expect(cancelled).toMatchObject({ active: false, invoiceId: 'EFMUM/2026-27/S/000492', cancelReason: 'Raised twice' });
      const next = await service.create(payload({ paymentStatusId: PaymentStatusEnum.PAID }), financialManager, '127.0.0.1');
      expect(next.invoiceId).toBe('EFMUM/2026-27/S/000493');
      await expect(service.update(1, payload(), financialManager, '127.0.0.1')).rejects.toThrow('cancelled');
      await expect(service.cancel(1, 'again', financialManager, '127.0.0.1')).rejects.toThrow('cancelled');
    });

    it('cancel needs a reason', async () => {
      const { service } = setup();
      await service.create(payload(), financialManager, '127.0.0.1');
      await expect(service.cancel(1, '  ', financialManager, '127.0.0.1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('invoice date rules (A6, A7)', () => {
    it('allows 11 Aug 2026 issued on 26 Oct and numbers it in FY 2026-27', async () => {
      const { service } = setup();
      const saved = await service.create(
        payload({ invoiceDate: '2026-08-11', paymentStatusId: PaymentStatusEnum.PAID }),
        financialManager,
        '127.0.0.1',
      );
      expect(saved.invoiceId).toBe('EFMUM/2026-27/S/000492');
    });

    it('refuses a future date (franchise-local today)', async () => {
      const { service } = setup();
      await expect(service.create(payload({ invoiceDate: '2026-10-27' }), financialManager, '127.0.0.1')).rejects.toThrow(
        'in the future',
      );
    });

    it('uses the business timezone for today: 26 Oct 01:00 IST is still 25 Oct in UTC', async () => {
      jest.setSystemTime(new Date('2026-10-25T19:30:00Z'));
      const { service } = setup();
      await expect(service.create(payload({ invoiceDate: '2026-10-26' }), financialManager, '127.0.0.1')).resolves.toBeDefined();
    });

    it('refuses a date in FY 2025-26', async () => {
      const { service } = setup();
      await expect(service.create(payload({ invoiceDate: '2026-03-31' }), financialManager, '127.0.0.1')).rejects.toThrow(
        'FY 2025-26',
      );
    });

    it('needs confirmation when the series already has a later-dated invoice, naming that date', async () => {
      const { service, store } = setup('2026-10-25');
      const request = payload({ invoiceDate: '2026-10-01', paymentStatusId: PaymentStatusEnum.PAID });
      const attempt = service.create(request, financialManager, '127.0.0.1');
      await expect(attempt).rejects.toThrow(ConflictException);
      await expect(service.create(request, financialManager, '127.0.0.1')).rejects.toThrow('25 Oct 2026');
      expect(store.size).toBe(0);
      const saved = await service.create({ ...request, confirmBackdate: true }, financialManager, '127.0.0.1');
      expect(saved.invoiceId).toBe('EFMUM/2026-27/S/000492');
    });

    it('does not warn for a PENDING save (the row is not in the series yet)', async () => {
      const { service } = setup('2026-10-25');
      await expect(
        service.create(payload({ invoiceDate: '2026-08-11' }), financialManager, '127.0.0.1'),
      ).resolves.toMatchObject({ invoiceId: null });
    });

    it('checks the series of the right franchise and FY', async () => {
      const { service, sequelize } = setup('2026-10-25');
      await expect(
        service.create(payload({ invoiceDate: '2026-10-01', paymentStatusId: PaymentStatusEnum.PAID }), financialManager, '127.0.0.1'),
      ).rejects.toThrow(ConflictException);
      const [, options] = sequelize.query.mock.calls[0] as unknown as [string, { replacements: Record<string, unknown> }];
      expect(options.replacements).toEqual({ franchiseId: 1, prefix: 'EFMUM/2026-27/S/' });
    });
  });

  describe('payment details (decision 7)', () => {
    it.each([
      ['paymentModeId', { paymentModeId: null }],
      ['paymentDate', { paymentDate: null }],
      ['transactionId', { transactionId: '' }],
    ])('requires %s, as on manual member payments', async (_field, over) => {
      const { service } = setup();
      await expect(service.create(payload(over), financialManager, '127.0.0.1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('bill-to validation (A16)', () => {
    const errorsFor = async (over: Record<string, unknown>) => {
      const dto = plainToInstance(ManageWorkshopInvoiceDto, { ...payload(), ...over });
      return (await validate(dto)).map((e) => e.property);
    };

    it('accepts a complete payload', async () => {
      expect(await errorsFor({})).toEqual([]);
    });

    it.each([
      ['billToName', ''],
      ['billToAddressLine1', ''],
      ['billToCity', ''],
      ['billToPinCode', ''],
      ['billToCountryId', undefined],
      ['billToStateId', undefined],
    ])('rejects a missing %s', async (field, value) => {
      expect(await errorsFor({ [field]: value })).toContain(field);
    });

    it.each([
      ['billToEmail', 'not-an-email'],
      ['billToGstin', '27ABCDE1234F1Z'],
      ['billToGstin', '27ABCDE1234F1X5'],
      ['invoiceDate', '11/08/2026'],
      ['quantity', 0],
      ['unitRate', -1],
    ])('rejects %s = %p', async (field, value) => {
      expect(await errorsFor({ [field]: value })).toContain(field);
    });

    it('accepts a valid GSTIN (any case) and empty optional fields', async () => {
      expect(await errorsFor({ billToGstin: '27abcde1234f1z5', billToEmail: '', billToPhone: '' })).toEqual([]);
    });

    it('refuses an Indian pincode that is not 6 digits', async () => {
      const { service } = setup();
      await expect(service.create(payload({ billToPinCode: '40001' }), financialManager, '127.0.0.1')).rejects.toThrow(
        'Pincode must be 6 digits',
      );
    });

    it('stores the bill-to details as entered', async () => {
      const { service, store } = setup();
      await service.create(
        payload({
          billToName: 'Org Pvt Ltd',
          billToContactPerson: 'A. Person',
          billToEmail: 'accounts@org.test',
          billToPhone: '+91 98200 00000',
          billToGstin: '27abcde1234f1z5',
          billToAddressLine2: 'Floor 2',
        }),
        financialManager,
        '127.0.0.1',
      );
      expect(store.get(1)).toMatchObject({
        billToName: 'Org Pvt Ltd',
        billToContactPerson: 'A. Person',
        billToEmail: 'accounts@org.test',
        billToPhone: '+91 98200 00000',
        billToGstin: '27ABCDE1234F1Z5',
        billToAddress: { postalAddress: '<Address line 1>', addressName: 'Floor 2', cityVillage: '<City>', pinCode: '400001' },
      });
    });
  });

  describe('locking after issue (A8)', () => {
    const issue = async () => {
      const ctx = setup();
      await ctx.service.create(payload({ paymentStatusId: PaymentStatusEnum.PAID }), financialManager, '127.0.0.1');
      return ctx;
    };

    it.each([
      ['quantity', { quantity: 201 }],
      ['unit rate', { unitRate: 900 }],
      ['description', { description: 'Another workshop' }],
      ['currency', { currency: 'USD' }],
      ['bill-to State', { billToStateId: KARNATAKA }],
      ['place of supply', { placeOfSupplyStateId: KARNATAKA }],
      ['invoice date', { invoiceDate: '2026-10-25' }],
      ['date of supply', { supplyDate: '2026-08-12' }],
      ['franchise', { franchiseId: 2 }],
    ])('refuses a change to %s', async (label, over) => {
      const { service } = await issue();
      await expect(
        service.update(1, payload({ paymentStatusId: PaymentStatusEnum.PAID, ...over }), financialManager, '127.0.0.1'),
      ).rejects.toThrow(label);
    });

    it('saves name, address lines, email, phone, GSTIN, notes and payment reference', async () => {
      const { service, store } = await issue();
      const before = { ...store.get(1)! };
      const saved = await service.update(
        1,
        payload({
          paymentStatusId: PaymentStatusEnum.PAID,
          billToName: 'Corrected Name',
          billToAddressLine1: 'New line 1',
          billToAddressLine2: 'New line 2',
          billToEmail: 'new@org.test',
          billToPhone: '+91 90000 00000',
          billToGstin: '27ABCDE1234F1Z5',
          notes: 'PO 42',
          transactionId: 'UTR-0002',
        }),
        financialManager,
        '127.0.0.1',
      );
      expect(saved).toMatchObject({
        billToName: 'Corrected Name',
        billToEmail: 'new@org.test',
        billToGstin: '27ABCDE1234F1Z5',
        notes: 'PO 42',
        transactionId: 'UTR-0002',
        invoiceId: 'EFMUM/2026-27/S/000492',
        totalAmount: before.totalAmount,
        taxObj: before.taxObj,
      });
      expect(saved.billToAddress).toMatchObject({ postalAddress: 'New line 1', addressName: 'New line 2', state: 'Maharashtra' });
    });

    it('allows every money field to change before issue, and recalculates', async () => {
      const { service } = setup();
      await service.create(payload(), financialManager, '127.0.0.1');
      const saved = await service.update(
        1,
        payload({ quantity: 174, billToStateId: KARNATAKA }),
        financialManager,
        '127.0.0.1',
      );
      expect(saved).toMatchObject({ quantity: 174, totalAmount: 174522, taxAmount: 26622 });
      expect(Object.keys(saved.taxObj)).toEqual(['IGST']);
    });
  });

  describe('franchise scoping and permissions (A12)', () => {
    it('an HCUAE-only admin gets 404 on an EFMUM invoice for read, update and cancel', async () => {
      const { service } = setup();
      await service.create(payload(), financialManager, '127.0.0.1');
      await expect(service.findById(1, hcuaeOnly)).rejects.toThrow(NotFoundException);
      await expect(service.update(1, payload(), hcuaeOnly, '127.0.0.1')).rejects.toThrow(NotFoundException);
      await expect(service.cancel(1, 'x', hcuaeOnly, '127.0.0.1')).rejects.toThrow(NotFoundException);
    });

    it('an HCUAE-only admin cannot create or preview for EFMUM', async () => {
      const { service } = setup();
      await expect(service.create(payload(), hcuaeOnly, '127.0.0.1')).rejects.toThrow(NotFoundException);
      await expect(
        service.calculateTax(
          { franchiseId: 1, billToCountryId: INDIA, billToStateId: MAHARASHTRA, quantity: 1, unitRate: 1, currency: 'INR' },
          hcuaeOnly,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('moving an unissued invoice to a franchise the admin is not in is refused', async () => {
      const { service } = setup();
      await service.create(payload(), financialManager, '127.0.0.1');
      await expect(service.update(1, payload({ franchiseId: 2 }), financialManager, '127.0.0.1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('a role without WorkshopInvoice permission gets 403', async () => {
      const { service } = setup();
      await service.create(payload(), financialManager, '127.0.0.1');
      await expect(service.findById(1, noPermission)).rejects.toThrow(ForbiddenException);
      await expect(service.create(payload(), noPermission, '127.0.0.1')).rejects.toThrow(ForbiddenException);
    });

    it('a read-only role cannot cancel', async () => {
      const { service } = setup();
      await service.create(payload(), financialManager, '127.0.0.1');
      await expect(service.cancel(1, 'x', user([1], ['read']), '127.0.0.1')).rejects.toThrow(ForbiddenException);
    });

    it('Super Admin (no franchise scope) can read any franchise', async () => {
      const { service } = setup();
      await service.create(payload(), financialManager, '127.0.0.1');
      await expect(service.findById(1, superAdmin)).resolves.toMatchObject({ workshopInvoiceId: 1 });
    });

    it('the master data lists only the admin\'s franchises', async () => {
      const { service } = setup();
      expect((await service.loadMasterData(hcuaeOnly)).franchise.map((f) => f.id)).toEqual([2]);
      expect((await service.loadMasterData(superAdmin)).franchise.map((f) => f.id)).toEqual([1, 2]);
    });

    it('the list is filtered to the admin\'s franchises', async () => {
      const { service, listQuery } = setup();
      const search = { page: 0, limit: 15 };
      const franchiseFilter = (call: number) =>
        (listQuery.mock.calls[call][0].where['franchiseId'] as Record<symbol, number[]> | undefined)?.[Op.in];
      await service.findAll(search, financialManager);
      expect(franchiseFilter(0)).toEqual([1]);
      await service.findAll({ ...search, franchiseId: 1 }, hcuaeOnly);
      expect(franchiseFilter(1)).toEqual([]);
      await service.findAll(search, superAdmin);
      expect(franchiseFilter(2)).toBeUndefined();
      await service.findAll({ ...search, franchiseId: 2, includeCancelled: false, search: 'gut' }, superAdmin);
      const where = listQuery.mock.calls[3][0].where;
      expect(franchiseFilter(3)).toEqual([2]);
      expect(where['active']).toBe(true);
      expect(where[Op.or]).toHaveLength(3);
    });

    it('CASL is checked with the row franchise', () => {
      const ability = new CaslAbilityFactory().createForUser(financialManager);
      expect(ability.can(AdminActionEnum.Read, AdminSubjectEnum.WorkshopInvoice)).toBe(true);
    });
  });
});
