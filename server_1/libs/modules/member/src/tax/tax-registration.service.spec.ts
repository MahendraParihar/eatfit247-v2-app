import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Op } from 'sequelize';
import { IAuthUser, TaxTypeEnum } from '@eatfit247-shared-lib';
import { MstFranchise } from '@server_1/core';
import { AddressService, CountryService } from '@server_1/platform';
import { MstFranchiseTaxRegistration, TaxRegistrationService } from '@server_1/modules/tax-engine';

type Row = Record<string, unknown> & { taxRegistrationId: number; update: (values: Record<string, unknown>) => Promise<Row> };

/**
 * An in-memory `mst_franchise_tax_registrations` that honours the `where` keys the service uses (equality,
 * `Op.ne`, `Op.in`), so the date, overlap and number logic run for real.
 */
class FakeRegistrations {
  rows: Row[] = [];
  private nextId = 1;

  add(fields: Record<string, unknown>): Row {
    const row = { taxRegistrationId: this.nextId++, active: true, effectiveTo: null, stateCode: null, ...fields } as Row;
    row.update = async (values: Record<string, unknown>) => Object.assign(row, values);
    this.rows.push(row);
    return row;
  }

  private matches(row: Row, where: Record<string | symbol, unknown>): boolean {
    return Object.entries(where).every(([key, value]) => {
      if (value && typeof value === 'object') {
        const ops = value as Record<symbol, unknown>;
        if (Op.ne in ops) return row[key] !== ops[Op.ne];
        if (Op.in in ops) return (ops[Op.in] as unknown[]).includes(row[key]);
      }
      return row[key] === value;
    });
  }

  readonly repository = {
    findAll: async ({ where }: { where: Record<string, unknown> }) =>
      this.rows.filter((row) => this.matches(row, where)).sort((a, b) => String(b['effectiveFrom']).localeCompare(String(a['effectiveFrom']))),
    findOne: async ({ where }: { where: Record<string, unknown> }) => this.rows.find((row) => this.matches(row, where)) ?? null,
    count: async ({ where }: { where: Record<string, unknown> }) => this.rows.filter((row) => this.matches(row, where)).length,
    create: async (values: Record<string, unknown>) => this.add(values),
  };
}

/** Configurable tax treatment, plans 4.1 and 4b (decisions 8, 12, 14). */
describe('TaxRegistrationService', () => {
  const superAdmin = { adminId: 1, franchiseIds: [], allFranchises: true } as unknown as IAuthUser;
  const efmumAdmin = { adminId: 21, franchiseIds: [1], allFranchises: false } as unknown as IAuthUser;
  const EFMUM_GSTIN = '27CSEPS5397E1Z8';
  const SAMPLE_GSTIN = '27AAPFU0939F1ZV';
  const TODAY = '2026-10-25';

  let fake: FakeRegistrations;
  let columns: Record<number, Record<string, unknown>>;
  let country: string | null;
  let service: TaxRegistrationService;

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(`${TODAY}T06:00:00Z`), doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'] });
    fake = new FakeRegistrations();
    columns = { 1: {}, 2: {}, 3: {} };
    country = 'IN';
    service = new TaxRegistrationService(
      fake.repository as unknown as typeof MstFranchiseTaxRegistration,
      {
        findByPk: jest.fn().mockImplementation(async (id: number) => ({ franchiseId: id, timeZone: 'Asia/Kolkata', currencyCode: id === 2 ? 'AED' : 'INR' })),
        update: jest.fn().mockImplementation(async (values: Record<string, unknown>, { where }: { where: { franchiseId: number } }) => {
          Object.assign(columns[where.franchiseId], values);
        }),
      } as unknown as typeof MstFranchise,
      { findByTableIdAndPk: jest.fn().mockImplementation(async () => (country ? { countryCode: country } : null)) } as unknown as AddressService,
      {
        findAll: jest.fn().mockResolvedValue({ tableData: [{ countryCode: 'IN', currencyCode: 'INR' }, { countryCode: 'AE', currencyCode: 'AED' }], count: 2 }),
      } as unknown as CountryService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const gst = (fields: Record<string, unknown> = {}) =>
    ({ countryCode: 'IN', taxSystem: TaxTypeEnum.GST, registrationNumber: EFMUM_GSTIN, effectiveFrom: '2017-04-28', ...fields }) as never;
  const efmumGst = (fields: Record<string, unknown> = {}) =>
    fake.add({ franchiseId: 1, countryCode: 'IN', taxSystem: TaxTypeEnum.GST, registrationNumber: EFMUM_GSTIN, stateCode: '27', currencyCode: 'INR', effectiveFrom: '2017-04-28', ...fields });

  describe('date helpers (the one place the date logic lives)', () => {
    it.each([
      ['2017-04-27', false],
      ['2017-04-28', true],
      ['2027-03-31', true],
      ['2027-04-01', false],
    ])('effective on %s: %s (from 2017-04-28 to 2027-03-31, both inclusive)', (date, expected) => {
      expect(TaxRegistrationService.isEffectiveOn({ effectiveFrom: '2017-04-28', effectiveTo: '2027-03-31' }, date)).toBe(expected);
    });

    it('open-ended periods', () => {
      expect(TaxRegistrationService.isEffectiveOn({ effectiveFrom: '2017-04-28', effectiveTo: null }, '2099-01-01')).toBe(true);
      expect(TaxRegistrationService.periodsOverlap('2020-01-01', null, '2030-01-01', null)).toBe(true);
      expect(TaxRegistrationService.periodsOverlap('2020-01-01', '2024-12-31', '2025-01-01', null)).toBe(false);
      expect(TaxRegistrationService.periodsOverlap('2026-01-01', null, '2020-01-01', '2026-01-01')).toBe(true);
      expect(TaxRegistrationService.periodsOverlap('2026-01-02', null, '2020-01-01', '2026-01-01')).toBe(false);
      expect(TaxRegistrationService.dayBefore('2026-03-01')).toBe('2026-02-28');
    });
  });

  describe('readers', () => {
    it('registered only on dates the registration covers', async () => {
      efmumGst({ effectiveTo: '2026-09-30' });
      await expect(service.isRegistered(1, TaxTypeEnum.GST, 'IN', '2017-04-28')).resolves.toBe(true);
      await expect(service.isRegistered(1, TaxTypeEnum.GST, 'IN', '2017-04-27')).resolves.toBe(false);
      await expect(service.isRegistered(1, TaxTypeEnum.GST, 'IN', TODAY)).resolves.toBe(false);
      await expect(service.registeredBetween(1, TaxTypeEnum.GST, 'IN', '2026-09-01', '2026-09-30')).resolves.toBe(true);
      await expect(service.registeredBetween(1, TaxTypeEnum.GST, 'IN', '2026-10-01', '2026-10-31')).resolves.toBe(false);
      await expect(service.gstRegisteredFranchiseIds([1, 3], '2026-09-30')).resolves.toEqual(new Set([1]));
    });

    it('invoiceRegistration: the number effective on the invoice date, with its label; none when unregistered', async () => {
      efmumGst({ effectiveTo: '2026-10-24' });
      efmumGst({ registrationNumber: SAMPLE_GSTIN, effectiveFrom: TODAY });
      await expect(service.invoiceRegistration(1, 'IN', '2017-06-01')).resolves.toMatchObject({ registrationNumber: EFMUM_GSTIN, label: 'GSTIN' });
      await expect(service.invoiceRegistration(1, 'IN', TODAY)).resolves.toMatchObject({ registrationNumber: SAMPLE_GSTIN });
      await expect(service.invoiceRegistration(1, 'IN', '2017-04-27')).resolves.toBeNull();
      fake.add({ franchiseId: 2, countryCode: 'AE', taxSystem: TaxTypeEnum.VAT, registrationNumber: '100123456700003', currencyCode: 'AED', effectiveFrom: '2026-02-02' });
      await expect(service.invoiceRegistration(2, 'AE', TODAY)).resolves.toMatchObject({ label: 'TRN', currencyCode: 'AED' });
    });
  });

  describe('create / update', () => {
    it('stores a GSTIN with its State and currency, and mirrors it into the franchise column', async () => {
      await service.create(1, gst({ registrationNumber: ' 27-cseps5397e1z8 ' }), superAdmin, 'ip');
      expect(fake.rows[0]).toMatchObject({ franchiseId: 1, registrationNumber: EFMUM_GSTIN, stateCode: '27', currencyCode: 'INR', createdBy: 1 });
      expect(columns[1]).toEqual({ gstNumber: EFMUM_GSTIN });
    });

    it('a UAE VAT registration takes AED and must be a 15-digit TRN', async () => {
      country = 'AE';
      await service.create(2, { countryCode: 'AE', taxSystem: TaxTypeEnum.VAT, registrationNumber: '100123456700003', effectiveFrom: '2026-01-01' } as never, superAdmin, 'ip');
      expect(fake.rows[0]).toMatchObject({ currencyCode: 'AED', stateCode: null });
      expect(columns[2]).toEqual({ vatNumber: '100123456700003' });
      await expect(
        service.create(3, { countryCode: 'AE', taxSystem: TaxTypeEnum.VAT, registrationNumber: '456789', effectiveFrom: '2026-01-01' } as never, superAdmin, 'ip'),
      ).rejects.toThrow('A UAE TRN has 15 digits.');
    });

    it.each([
      ['an invalid GSTIN', gst({ registrationNumber: '456789' }), '15 characters'],
      ['GST outside India', gst({ countryCode: 'AE' }), 'GST registrations are Indian'],
      ['a sales-tax registration (next spec)', gst({ taxSystem: TaxTypeEnum.SALES_TAX }), 'GST or VAT'],
      ['an end before the start', gst({ effectiveTo: '2016-01-01' }), 'ends before it starts'],
    ])('refuses %s, writing nothing', async (_label, body, message) => {
      await expect(service.create(1, body, superAdmin, 'ip')).rejects.toThrow(message);
      expect(fake.rows).toHaveLength(0);
    });

    it('overlap: refused when the periods share a day, allowed back to back', async () => {
      efmumGst({ effectiveTo: '2026-09-30' });
      await expect(service.create(1, gst({ registrationNumber: SAMPLE_GSTIN, effectiveFrom: '2026-09-30' }), superAdmin, 'ip')).rejects.toThrow(
        `overlap the active GST registration ${EFMUM_GSTIN}`,
      );
      await service.create(1, gst({ registrationNumber: SAMPLE_GSTIN, effectiveFrom: '2026-10-01' }), superAdmin, 'ip');
      expect(fake.rows).toHaveLength(2);
    });

    it("refuses another franchise's active number", async () => {
      efmumGst();
      await expect(service.create(3, gst(), superAdmin, 'ip')).rejects.toThrow(`${EFMUM_GSTIN} is already an active registration of franchise 1`);
    });

    it('an update without a currency keeps the stored one', async () => {
      const row = fake.add({ franchiseId: 1, countryCode: 'AE', taxSystem: TaxTypeEnum.VAT, registrationNumber: '100999888777000', currencyCode: 'USD', effectiveFrom: '2026-11-01' });
      await service.update(1, row.taxRegistrationId, { countryCode: 'AE', taxSystem: TaxTypeEnum.VAT, registrationNumber: '100999888777000', effectiveFrom: '2026-11-01', effectiveTo: '2027-03-31' } as never, superAdmin, 'ip');
      expect(row).toMatchObject({ currencyCode: 'USD', effectiveTo: '2027-03-31' });
    });

    it('a franchise admin manages only their own franchises (403 elsewhere)', async () => {
      const own = efmumGst();
      await expect(service.list(2, efmumAdmin)).rejects.toThrow(ForbiddenException);
      await expect(service.create(2, gst(), efmumAdmin, 'ip')).rejects.toThrow(ForbiddenException);
      await expect(service.update(2, own.taxRegistrationId, gst(), efmumAdmin, 'ip')).rejects.toThrow(ForbiddenException);
      await expect(service.changeStatus(2, own.taxRegistrationId, false, efmumAdmin, 'ip')).rejects.toThrow(ForbiddenException);
      await service.changeStatus(1, own.taxRegistrationId, false, efmumAdmin, 'ip');
      expect(own).toMatchObject({ active: false, modifiedBy: 21 });
      expect(columns[1]).toEqual({ gstNumber: null });
    });
  });

  describe("the franchise form's legacy GSTIN / VAT field (one release, plan 4b)", () => {
    it('a changed GSTIN ends the current registration yesterday and opens a new one today: history is kept', async () => {
      const current = efmumGst();
      await service.syncFromFranchiseForm(1, { gstNumber: SAMPLE_GSTIN.toLowerCase() }, { gstNumber: EFMUM_GSTIN }, 1, 'ip');
      expect(current).toMatchObject({ registrationNumber: EFMUM_GSTIN, effectiveFrom: '2017-04-28', effectiveTo: '2026-10-24', active: true });
      expect(fake.rows[1]).toMatchObject({ registrationNumber: SAMPLE_GSTIN, effectiveFrom: TODAY, effectiveTo: null, stateCode: '27' });
      // An old invoice still prints the old number
      await expect(service.invoiceRegistration(1, 'IN', '2026-06-01')).resolves.toMatchObject({ registrationNumber: EFMUM_GSTIN });
      expect(columns[1]).toEqual({ gstNumber: SAMPLE_GSTIN });
    });

    it('a cleared GSTIN ends the registration yesterday (earlier invoices stay registered)', async () => {
      const current = efmumGst();
      await service.syncFromFranchiseForm(1, { gstNumber: '' }, { gstNumber: EFMUM_GSTIN }, 1, 'ip');
      expect(current).toMatchObject({ effectiveTo: '2026-10-24', active: true });
      await expect(service.isRegistered(1, TaxTypeEnum.GST, 'IN', '2026-10-24')).resolves.toBe(true);
      await expect(service.isRegistered(1, TaxTypeEnum.GST, 'IN', TODAY)).resolves.toBe(false);
      expect(columns[1]).toEqual({ gstNumber: null });
    });

    it('a registration that starts today is deactivated, not ended before it began', async () => {
      const current = efmumGst({ effectiveFrom: TODAY });
      await service.syncFromFranchiseForm(1, { gstNumber: '' }, { gstNumber: EFMUM_GSTIN }, 1, 'ip');
      expect(current).toMatchObject({ active: false, effectiveTo: null });
    });

    it('an unchanged or omitted field changes nothing, even a legacy value 146 skipped', async () => {
      await service.syncFromFranchiseForm(1, { gstNumber: '456789' }, { gstNumber: '456789' }, 1, 'ip');
      await service.syncFromFranchiseForm(1, {}, { gstNumber: EFMUM_GSTIN }, 1, 'ip');
      expect(fake.rows).toHaveLength(0);
      expect(columns[1]).toEqual({});
      await expect(service.assertFranchiseFormNumbers(1, 'IN', { gstNumber: '456789' }, { gstNumber: '456789' })).resolves.toBeUndefined();
    });

    it('the pre-check runs every check the sync makes, so a refused number writes nothing', async () => {
      efmumGst();
      await expect(service.assertFranchiseFormNumbers(3, 'IN', { gstNumber: EFMUM_GSTIN }, { gstNumber: null })).rejects.toThrow(
        'already an active registration of franchise 1',
      );
      await expect(service.assertFranchiseFormNumbers(3, 'IN', { gstNumber: '456780' }, { gstNumber: '456789' })).rejects.toThrow(BadRequestException);
      await expect(service.assertFranchiseFormNumbers(null, 'AE', { vatNumber: '123' }, {})).rejects.toThrow('15 digits');
      expect(fake.rows).toHaveLength(1);
    });

    it('a new number that would overlap a future registration is refused before anything is written', async () => {
      fake.add({ franchiseId: 3, countryCode: 'IN', taxSystem: TaxTypeEnum.GST, registrationNumber: SAMPLE_GSTIN, currencyCode: 'INR', effectiveFrom: '2026-12-01' });
      await expect(service.assertFranchiseFormNumbers(3, 'IN', { gstNumber: '24AAACC1206D1ZM' }, { gstNumber: null })).rejects.toThrow('overlap');
    });

    it('without an address country nothing is synced', async () => {
      country = null;
      await service.syncFromFranchiseForm(1, { gstNumber: EFMUM_GSTIN }, {}, 1, 'ip');
      expect(fake.rows).toHaveLength(0);
      expect(columns[1]).toEqual({});
    });
  });

  it('GST at home in India, VAT anywhere else', () => {
    expect(TaxRegistrationService.homeTaxSystem('IN')).toBe(TaxTypeEnum.GST);
    expect(TaxRegistrationService.homeTaxSystem('ae')).toBe(TaxTypeEnum.VAT);
  });
});
