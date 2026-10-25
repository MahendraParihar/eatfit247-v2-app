import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { MstFranchise } from '@server_1/core';
import { AddressService } from '@server_1/platform';
import { MstTaxMaster, TaxMasterService, TaxRegistrationService } from '@server_1/modules/tax-engine';
import {
  CustomerScopeEnum,
  IAuthUser,
  MoneyConditionEnum,
  PaymentRouteEnum,
  TaxCategoryEnum,
  TaxTreatmentEnum,
  TaxTypeEnum,
  TransactionType,
} from '@eatfit247-shared-lib';

/** A role with grant_all_on_new_subject: every franchise (configurable tax treatment 3b.1) */
const superAdmin = { adminId: 1, franchiseIds: [], allFranchises: true } as unknown as IAuthUser;
const efmumAdmin = { adminId: 21, franchiseIds: [1], allFranchises: false } as unknown as IAuthUser;
// Super admins 2, 4 and 5 are mapped to EFMUM in the data (group 3 review finding 1)
const mappedSuperAdmin = { adminId: 2, franchiseIds: [1], allFranchises: true } as unknown as IAuthUser;
const unmappedAdmin = { adminId: 30, franchiseIds: [], allFranchises: false } as unknown as IAuthUser;

type Row = Record<string, unknown> & { id: number };

/** An in-memory `mst_tax_master` honouring the `where` keys the service uses (equality and `Op.in`). */
class FakeRules {
  rows: Row[] = [];
  private nextId = 1;

  add(fields: Record<string, unknown>): Row {
    const row: Row = {
      id: this.nextId++,
      franchiseId: 1,
      countryCode: 'IN ',
      transactionType: TransactionType.SERVICE,
      referenceId: '1',
      taxSystem: TaxTypeEnum.GST,
      taxCode: 'GST_18',
      taxName: 'GST 18%',
      taxPercent: '18.00',
      isTaxInclusive: false,
      taxCategory: TaxCategoryEnum.STANDARD,
      hsnSacCode: '999319',
      legalBasis: 'Notif 11/2017-CT(R)',
      effectiveFrom: '2015-12-31',
      effectiveTo: null,
      active: true,
      customerScope: 'SAME_COUNTRY',
      placeOfSupplyCountryCode: null,
      stateRelation: 'ANY',
      registrationCondition: 'ANY',
      customerTypeCondition: 'ANY',
      electronicCondition: 'ANY',
      moneyCondition: 'ANY',
      appliesTo: 'ALL',
      treatment: 'CHARGE',
      refusalMessage: null,
      invoiceNote: null,
      requiresEvidence: false,
      fallbackTaxMasterId: null,
      fallbackOnly: false,
      createdIp: '::1',
      ...fields,
    };
    this.rows.push(row);
    return row;
  }

  private matches(row: Row, where: Record<string | symbol, unknown> = {}): boolean {
    return Object.entries(where).every(([key, value]) => {
      if (value && typeof value === 'object' && Op.in in (value as object)) {
        return ((value as Record<symbol, unknown[]>)[Op.in]).includes(row[key]);
      }
      return row[key] === value;
    });
  }

  private find = async ({ where }: { where?: Record<string, unknown> } = {}) => this.rows.find((row) => this.matches(row, where)) ?? null;

  readonly model = {
    findAll: async ({ where }: { where?: Record<string, unknown> } = {}) => this.rows.filter((row) => this.matches(row, where)),
    findOne: this.find,
    findByPk: async (id: number) => this.rows.find((row) => row.id === Number(id)) ?? null,
    create: jest.fn().mockImplementation(async (values: Record<string, unknown>) => this.add(values)),
    update: jest.fn().mockImplementation(async (values: Record<string, unknown>, { where }: { where: { id: number } }) => {
      Object.assign(this.rows.find((row) => row.id === Number(where.id)) as Row, values);
      return [1];
    }),
    scope: () => ({
      findOne: this.find,
      findAndCountAll: jest.fn().mockImplementation(async ({ where }: { where?: Record<string, unknown> }) => {
        const rows = this.rows.filter((row) => this.matches(row, where));
        return { rows, count: rows.length };
      }),
    }),
  };
}

/** Configurable tax treatment, plans 5.1–5.3 (decisions 3, 4, 7, 14; A7, A8, A12a, A22, A23c, A31). */
describe('TaxMasterService', () => {
  let rules: FakeRules;
  let vatRegistered: boolean;
  let registrationsIn: string[];
  let electronic: boolean;
  let service: TaxMasterService;

  // The seeded rule set of migration 146 (ids as on the local DB)
  const seed = () => {
    rules.add({ createdIp: ':0' }); // 1 EFMUM GST 18%
    rules.add({ franchiseId: 2, countryCode: 'AE ', taxSystem: TaxTypeEnum.VAT, taxCode: 'VAT_0', taxPercent: '0.00', taxCategory: TaxCategoryEnum.ZERO_RATED, effectiveFrom: '2025-12-31', legalBasis: 'ER Art 41', createdIp: ':0' }); // 2
    rules.add({ franchiseId: 3, transactionType: TransactionType.PRODUCT, taxCode: 'GST_12', taxPercent: '12.00', appliesTo: 'SPECIFIC', createdIp: ':0' }); // 3
    rules.add({ franchiseId: 3, transactionType: TransactionType.PRODUCT, taxCode: 'GST_5', taxPercent: '5.00', appliesTo: 'SPECIFIC', effectiveFrom: '2025-09-22', active: false, createdIp: ':0' }); // 4
    rules.add({ referenceId: '0', customerScope: 'ANY_FOREIGN', moneyCondition: 'FOREIGN', treatment: 'EXPORT_LUT_OR_TAX', taxCode: 'EXPORT_LUT', createdIp: ':0' }); // 5
    rules.add({ referenceId: '0', customerScope: 'ANY_FOREIGN', moneyCondition: 'DOMESTIC', taxCode: 'IGST_ABROAD_INR', createdIp: ':0' }); // 6
    rules.add({ franchiseId: 3, transactionType: TransactionType.PRODUCT, referenceId: '0', taxSystem: TaxTypeEnum.NONE, taxPercent: '0.00', stateRelation: 'OTHER', registrationCondition: 'UNREGISTERED', treatment: 'REFUSE', refusalMessage: 'Inter-state goods supply needs GST registration (CGST s.24(i)).', taxCode: 'REFUSE_S24', effectiveFrom: '2017-07-01', createdIp: ':0' }); // 7
    rules.add({ franchiseId: 3, transactionType: TransactionType.PRODUCT, customerScope: 'ANY_FOREIGN', treatment: 'EXPORT_LUT_OR_TAX', taxCode: 'EXPORT_GOODS', taxPercent: '12.00', appliesTo: 'SPECIFIC', createdIp: ':0' }); // 8
    rules.add({ franchiseId: 2, countryCode: 'AE ', referenceId: '0', taxSystem: TaxTypeEnum.VAT, taxCode: 'VAT_5_FALLBACK', taxPercent: '5.00', customerScope: 'ANY_FOREIGN', effectiveFrom: '2025-12-31', fallbackOnly: true, createdIp: ':0' }); // 9
    rules.add({ franchiseId: 2, countryCode: 'AE ', referenceId: '0', taxSystem: TaxTypeEnum.VAT, taxCode: 'VAT_0_EXPORT', taxPercent: '0.00', taxCategory: TaxCategoryEnum.ZERO_RATED, customerScope: 'ANY_FOREIGN', treatment: 'ZERO_RATED_EXPORT', requiresEvidence: true, fallbackTaxMasterId: 9, effectiveFrom: '2025-12-31', legalBasis: 'ER Art 31', createdIp: ':0' }); // 10
    rules.add({ franchiseId: 2, countryCode: 'AE ', transactionType: TransactionType.PRODUCT, referenceId: '0', taxSystem: TaxTypeEnum.VAT, taxCode: 'VAT_0_EXPORT_GOODS', taxPercent: '0.00', taxCategory: TaxCategoryEnum.ZERO_RATED, hsnSacCode: null, customerScope: 'ANY_FOREIGN', treatment: 'ZERO_RATED_EXPORT', effectiveFrom: '2025-12-31', legalBasis: 'ER Art 30', createdIp: ':0' }); // 11
  };

  beforeEach(() => {
    rules = new FakeRules();
    seed();
    vatRegistered = true;
    registrationsIn = ['IN', 'AE'];
    electronic = false;
    service = new TaxMasterService(
      rules.model as unknown as typeof MstTaxMaster,
      {
        // A registration in the franchise's own country follows vatRegistered; one abroad follows registrationsIn
        hasActive: jest.fn().mockImplementation(async (id: number, _system: string, country: string) =>
          country === (id === 2 ? 'AE' : 'IN') ? vatRegistered : registrationsIn.includes(country),
        ),
        home: jest.fn().mockImplementation(async (id: number) => (id === 3 ? null : { taxRegistrationId: id })),
      } as unknown as TaxRegistrationService,
      {
        findByPk: jest.fn().mockImplementation(async (id: number) =>
          id > 3 ? null : { franchiseId: id, timeZone: id === 2 ? 'Asia/Dubai' : 'Asia/Kolkata', currencyCode: id === 2 ? 'AED' : 'INR' },
        ),
      } as unknown as typeof MstFranchise,
      {
        findByTableIdAndPk: jest.fn().mockImplementation(async (_table: number, id: number) =>
          id === 2 ? { countryCode: 'AE', stateCode: 'AE-DU' } : { countryCode: 'IN', stateCode: '27' },
        ),
      } as unknown as AddressService,
      { query: jest.fn().mockImplementation(async () => [{ electronic }]) } as unknown as Sequelize,
    );
  });

  /** A new rule, as the form posts it. */
  const post = (fields: Record<string, unknown> = {}) =>
    ({
      franchiseId: 1,
      referenceId: 263,
      countryCode: 'IN',
      transactionType: TransactionType.SERVICE,
      taxSystem: TaxTypeEnum.GST,
      taxCode: 'GST_18_PLAN',
      taxName: 'GST 18% plan 263',
      taxPercent: 18,
      applyOn: 'SALE',
      isTaxInclusive: false,
      effectiveFrom: new Date('2026-11-01'),
      ...fields,
    }) as never;

  /** What today's admin form PUTs for an existing rule: every legacy field, numbers as numbers, the picker's Date. */
  const form = (id: number, overrides: Record<string, unknown> = {}) => {
    const row = rules.rows.find((r) => r.id === id) as Row;
    return {
      franchiseId: row['franchiseId'],
      referenceId: Number(row['referenceId']),
      countryCode: String(row['countryCode']).trim(),
      transactionType: row['transactionType'],
      taxSystem: row['taxSystem'],
      taxCode: row['taxCode'],
      taxName: row['taxName'],
      taxPercent: Number(row['taxPercent']),
      applyOn: 'SALE',
      isTaxInclusive: row['isTaxInclusive'],
      taxCategory: row['taxCategory'],
      hsnSacCode: row['hsnSacCode'] ?? undefined,
      legalBasis: row['legalBasis'],
      // The picker sends the admin's local midnight (IST) in UTC
      effectiveFrom: new Date(`${String(row['effectiveFrom'])}T00:00:00+05:30`),
      effectiveTo: row['effectiveTo'] ? new Date(`${String(row['effectiveTo'])}T00:00:00+05:30`) : null,
      ...overrides,
    } as never;
  };

  describe('save: guardrails (5.2, A8)', () => {
    it("today's form still saves a plain rate rule (reference 1 → ALL, 263 → SPECIFIC; plan 1b.6)", async () => {
      await expect(service.create(post({ referenceId: 1 }), 'ip', superAdmin)).resolves.toMatchObject({ warnings: [] });
      expect(rules.rows.at(-1)).toMatchObject({ appliesTo: 'ALL', treatment: 'CHARGE', customerScope: 'SAME_COUNTRY' });
      await service.create(post(), 'ip', superAdmin);
      expect(rules.rows.at(-1)).toMatchObject({ appliesTo: 'SPECIFIC', referenceId: 263 });
    });

    it('a hard block is a 400 naming the reason, and nothing is written', async () => {
      await expect(service.create(post({ customerScope: CustomerScopeEnum.ANY_FOREIGN, treatment: TaxTreatmentEnum.ZERO_RATED_EXPORT }), 'ip', superAdmin)).rejects.toThrow(
        'A zero-rated export is a VAT treatment',
      );
      await expect(service.create(post({ taxPercent: 120 }), 'ip', superAdmin)).rejects.toThrow('between 0 and 100');
      expect(rules.model.create).not.toHaveBeenCalled();
    });

    it('a warning without a legal basis is a 400 listing it; with a legal basis it saves and returns the warning', async () => {
      const igstOnExport = post({ referenceId: 0, appliesTo: 'ALL', customerScope: CustomerScopeEnum.ANY_FOREIGN, moneyCondition: MoneyConditionEnum.FOREIGN, effectiveFrom: new Date('2026-12-01') });
      await expect(service.create(igstOnExport, 'ip', superAdmin)).rejects.toThrow('A legal basis is required for this rule: This charges IGST on a sale abroad paid in foreign money');
      const saved = await service.create({ ...(igstOnExport as object), legalBasis: 'CA advice 2026-11: LUT lapsed' } as never, 'ip', superAdmin);
      expect(saved.warnings.map((warning) => warning.code)).toEqual(['GST_ON_FOREIGN_MONEY_SALE']);
      expect(rules.rows.at(-1)).toMatchObject({ id: saved.id, legalBasis: 'CA advice 2026-11: LUT lapsed' });
    });

    it('a VAT rule needs an active VAT registration to be active; a staged one is created and edited without it (5b.5)', async () => {
      vatRegistered = false;
      const vat = post({ franchiseId: 2, countryCode: 'AE', taxSystem: TaxTypeEnum.VAT, taxPercent: 5, referenceId: 262 });
      await expect(service.create(vat, 'ip', superAdmin)).rejects.toThrow('VAT registration (TRN)');
      const staged = await service.create({ ...(vat as object), active: false } as never, 'ip', superAdmin);
      expect(rules.rows.find((r) => r.id === staged.id)).toMatchObject({ active: false, taxSystem: TaxTypeEnum.VAT });
      await expect(service.update(staged.id, form(staged.id, { taxPercent: 5 }), 'ip', superAdmin)).resolves.toBeDefined();
      await expect(service.changeStatus(staged.id, true, 'ip', superAdmin)).rejects.toThrow('VAT registration (TRN)');
    });

    it('A12a: a FOREIGN_REGISTRATION rule needs the franchise registered in that country (not a VAT registration at home)', async () => {
      registrationsIn = [];
      vatRegistered = false; // EFMUM has no VAT registration in India: that must not be the reason
      const foreignRegistration = post({
        taxSystem: TaxTypeEnum.VAT,
        taxPercent: 5,
        referenceId: 0,
        appliesTo: 'ALL',
        customerScope: CustomerScopeEnum.SPECIFIC_COUNTRY,
        placeOfSupplyCountryCode: 'AE',
        electronicCondition: 'YES',
        treatment: TaxTreatmentEnum.FOREIGN_REGISTRATION,
      });
      await expect(service.create(foreignRegistration, 'ip', superAdmin)).rejects.toThrow("needs the franchise's active registration there");
    });

    it('A7: equal conditions and the same effective date are refused (naming the rule); a later date saves', async () => {
      const twin = post({ referenceId: 1, effectiveFrom: new Date('2015-12-31'), taxCode: 'OTHER_LABEL' });
      await expect(service.create(twin, 'ip', superAdmin)).rejects.toThrow('Rule 1 (GST_18) already has these conditions from 2015-12-31');
      await expect(service.create(post({ referenceId: 1, effectiveFrom: new Date('2026-11-01') }), 'ip', superAdmin)).resolves.toMatchObject({ warnings: [] });
    });

    it('A31: a fallback must be fallback-only; the fallback-only twin of a normal rule is no duplicate', async () => {
      const evidenceRule = (fallbackTaxMasterId: number) =>
        post({ franchiseId: 2, countryCode: 'AE', taxSystem: TaxTypeEnum.VAT, taxPercent: 0, taxCategory: TaxCategoryEnum.ZERO_RATED, referenceId: 262, customerScope: CustomerScopeEnum.ANY_FOREIGN, treatment: TaxTreatmentEnum.ZERO_RATED_EXPORT, requiresEvidence: true, fallbackTaxMasterId, legalBasis: 'ER Art 31' });
      await expect(service.create(evidenceRule(2), 'ip', superAdmin)).rejects.toThrow('only a fallback-only rule can be a fallback');
      await expect(service.create(evidenceRule(9), 'ip', superAdmin)).resolves.toBeDefined();
      // A fallback-only twin of rule 10's conditions saves (exempt from the duplicate check)
      const twin = post({ franchiseId: 2, countryCode: 'AE', taxSystem: TaxTypeEnum.VAT, taxPercent: 5, referenceId: 0, appliesTo: 'ALL', customerScope: CustomerScopeEnum.ANY_FOREIGN, effectiveFrom: new Date('2025-12-31'), fallbackOnly: true });
      await expect(service.create(twin, 'ip', superAdmin)).resolves.toBeDefined();
    });

    it('a seeded rule: an unchanged save passes; a tax change needs an updated legal basis and warns (5b.5)', async () => {
      await expect(service.update(1, form(1), 'ip', superAdmin)).resolves.toMatchObject({ warnings: [] });
      await expect(service.update(1, form(1, { taxPercent: 5 }), 'ip', superAdmin)).rejects.toThrow('update the legal basis');
      await expect(service.update(1, form(1, { taxPercent: 5, legalBasis: 'CA 2026-11: GST 2.0 slab' }), 'ip', superAdmin)).resolves.toMatchObject({
        warnings: [expect.objectContaining({ code: 'SEEDED_RULE_EDIT' })],
      });
    });

    it("today's form keeps the stored conditions, and an ALL rule stays ALL (rows 5, 7, 11; 5b.1)", async () => {
      await service.update(5, form(5), 'ip', superAdmin);
      expect(rules.rows[4]).toMatchObject({ customerScope: 'ANY_FOREIGN', moneyCondition: 'FOREIGN', treatment: 'EXPORT_LUT_OR_TAX', appliesTo: 'ALL' });
      await expect(service.update(7, form(7), 'ip', superAdmin)).resolves.toBeDefined();
      expect(rules.rows[6]).toMatchObject({ appliesTo: 'ALL', treatment: 'REFUSE', stateRelation: 'OTHER', registrationCondition: 'UNREGISTERED' });
      await expect(service.update(11, form(11), 'ip', superAdmin)).resolves.toBeDefined();
      expect(rules.rows[10]).toMatchObject({ appliesTo: 'ALL', treatment: 'ZERO_RATED_EXPORT' });
      // Changing the reference to a product makes it that product's rule
      await service.update(3, form(3, { referenceId: 2, legalBasis: 'new product' }), 'ip', superAdmin);
      expect(rules.rows[2]).toMatchObject({ appliesTo: 'SPECIFIC', referenceId: 2 });
    });

    it("a picker date is the day the admin chose (IST midnight → that day; 5b.2)", async () => {
      await service.create(post({ effectiveFrom: new Date('2026-11-30T18:30:00Z') }), 'ip', superAdmin);
      expect(rules.rows.at(-1)).toMatchObject({ effectiveFrom: '2026-12-01' });
      expect(TaxMasterService.day(new Date('2026-12-01T00:00:00-05:00'))).toBe('2026-12-01');
      expect(TaxMasterService.day('2026-12-01')).toBe('2026-12-01');
    });

    it('a fallback in use stays valid: its scope and dates must still cover the rules using it (5b.4)', async () => {
      await expect(service.update(9, form(9, { customerScope: CustomerScopeEnum.SAME_COUNTRY }), 'ip', superAdmin)).rejects.toThrow(
        'Rule 10 (VAT_0_EXPORT) uses this rule as its fallback',
      );
      await expect(service.update(9, form(9, { effectiveFrom: new Date('2026-06-01') }), 'ip', superAdmin)).rejects.toThrow("effective dates do not cover this rule's");
      await expect(service.update(9, form(9, { taxName: 'UAE VAT 5% (fallback)' }), 'ip', superAdmin)).resolves.toBeDefined();
    });

    it('leaving a specific-country scope clears the country; unknown franchise 404; the rule country is the franchise\'s (5b.5)', async () => {
      const us = await service.create(post({ customerScope: CustomerScopeEnum.SPECIFIC_COUNTRY, placeOfSupplyCountryCode: 'US', moneyCondition: MoneyConditionEnum.DOMESTIC }), 'ip', superAdmin);
      await service.update(us.id, form(us.id, { customerScope: CustomerScopeEnum.ANY_FOREIGN, moneyCondition: MoneyConditionEnum.DOMESTIC, effectiveFrom: new Date('2026-12-15') }), 'ip', superAdmin);
      expect(rules.rows.find((r) => r.id === us.id)).toMatchObject({ customerScope: 'ANY_FOREIGN', placeOfSupplyCountryCode: null });
      await expect(service.create(post({ franchiseId: 99 }), 'ip', superAdmin)).rejects.toThrow('Franchise not found');
      await expect(service.create(post({ franchiseId: 2, countryCode: 'IN', taxSystem: TaxTypeEnum.NONE, taxPercent: 0 }), 'ip', superAdmin)).rejects.toThrow("must be the franchise's country (AE)");
    });

    it('reactivating reruns the checks; a fallback in use cannot be deactivated', async () => {
      rules.rows[3].active = false;
      rules.add({ franchiseId: 3, transactionType: TransactionType.PRODUCT, taxCode: 'GST_5_TWIN', taxPercent: '5.00', appliesTo: 'SPECIFIC', effectiveFrom: '2025-09-22' });
      await expect(service.changeStatus(4, true, 'ip', superAdmin)).rejects.toThrow('already has these conditions');
      await expect(service.changeStatus(9, false, 'ip', superAdmin)).rejects.toThrow('Rule 10 (VAT_0_EXPORT) uses this rule as its fallback');
    });
  });

  describe('resolver (5.1)', () => {
    const facts = (overrides: Record<string, unknown> = {}) =>
      ({
        franchiseId: 1,
        supplierCountryCode: 'IN',
        supplierStateCode: '27',
        transactionType: TransactionType.SERVICE,
        referenceId: 263,
        placeOfSupplyCountryCode: 'US',
        placeOfSupplyStateCode: null,
        registered: true,
        customerType: 'B2C',
        electronic: false,
        money: 'FOREIGN',
        supplyDate: '2026-10-25',
        ...overrides,
      }) as never;

    it('resolves the seeded export rule; no match is today\'s 400', async () => {
      await expect(service.resolveOrThrow(facts())).resolves.toMatchObject({ id: 5 });
      await expect(service.resolveOrThrow(facts({ franchiseId: 2, supplierCountryCode: 'AE', transactionType: TransactionType.PRODUCT, placeOfSupplyCountryCode: 'AE', money: null }))).rejects.toThrow(
        'No active tax rule for franchise 2, country AE, PRODUCT (reference 263). Add it in Tax Master.',
      );
    });
  });

  describe('preview (5.3, A22, A23c)', () => {
    const preview = (fields: Record<string, unknown>, user: IAuthUser = superAdmin) =>
      service.preview({ franchiseId: 1, transactionType: TransactionType.SERVICE, referenceId: 263, supplyDate: '2026-10-25', ...fields } as never, user);

    it('a US client paying USD: the export rule wins, nothing is saved', async () => {
      const result = await preview({ billingCountryCode: 'US', currency: 'USD' });
      expect(result.winner).toMatchObject({ id: 5, treatment: 'EXPORT_LUT_OR_TAX' });
      expect(result.facts).toMatchObject({ placeOfSupplyCountryCode: 'US', money: 'FOREIGN', registered: true, customerType: 'B2C' });
      expect(rules.model.create).not.toHaveBeenCalled();
      expect(rules.model.update).not.toHaveBeenCalled();
    });

    it("money: INR (the franchise's own currency) is domestic; a foreign currency on the DOMESTIC route is still foreign", async () => {
      await expect(preview({ billingCountryCode: 'US', currency: 'INR' })).resolves.toMatchObject({ winner: { id: 6 }, facts: { money: 'DOMESTIC' } });
      await expect(preview({ billingCountryCode: 'US', currency: 'USD', paymentRoute: PaymentRouteEnum.DOMESTIC })).resolves.toMatchObject({ winner: { id: 5 } });
    });

    it('row 4: MEMUM goods to another State while unregistered → the refusal, with the product rate as runner-up and a shadowing warning', async () => {
      const result = await preview({ franchiseId: 3, transactionType: TransactionType.PRODUCT, referenceId: 1, deliveryCountryCode: 'IN', deliveryStateCode: '36' });
      expect(result.winner).toMatchObject({ id: 7, treatment: 'REFUSE' });
      expect(result.runnersUp.map((rule) => rule.id)).toEqual([3]);
      expect(result.facts).toMatchObject({ registered: false, money: null });
      expect(result.warnings).toEqual([expect.objectContaining({ code: 'SPECIFIC_RULE_SHADOWED' })]);
    });

    it('a valid customer GSTIN makes the sale B2B at the GSTIN State; an invalid one is ignored with a warning', async () => {
      await expect(preview({ billingCountryCode: 'IN', billingStateCode: '29', customerRegistrationNumber: '27CSEPS5397E1Z8', currency: 'INR' })).resolves.toMatchObject({
        facts: { customerType: 'B2B', placeOfSupplyStateCode: '27' },
        warnings: [expect.objectContaining({ code: 'GSTIN_STATE_DIFFERS' })],
      });
      await expect(preview({ billingCountryCode: 'IN', billingStateCode: '27', customerRegistrationNumber: '456789', currency: 'INR' })).resolves.toMatchObject({
        facts: { customerType: 'B2C' },
        warnings: [expect.objectContaining({ code: 'CUSTOMER_NUMBER_INVALID' })],
      });
    });

    it('the plan\'s electronic flag is a fact; no matching rule is a NO_RULE warning, not an error', async () => {
      electronic = true;
      await expect(preview({ billingCountryCode: 'US', currency: 'USD' })).resolves.toMatchObject({ facts: { electronic: true } });
      const none = await service.preview({ franchiseId: 2, transactionType: TransactionType.PRODUCT, referenceId: 9, deliveryCountryCode: 'AE', supplyDate: '2026-10-25' } as never, superAdmin);
      expect(none.winner).toBeNull();
      expect(none.warnings).toEqual([expect.objectContaining({ code: 'NO_RULE' })]);
    });

    it("A23c: scoped like the list (403 for another franchise; a super admin mapped to EFMUM still reaches HCUAE)", async () => {
      await expect(preview({ franchiseId: 2, billingCountryCode: 'US' }, efmumAdmin)).rejects.toThrow(ForbiddenException);
      await expect(preview({ franchiseId: 2, billingCountryCode: 'US' }, mappedSuperAdmin)).resolves.toMatchObject({ winner: { id: 10 } });
      await expect(preview({ billingCountryCode: 'US' }, unmappedAdmin)).rejects.toThrow(ForbiddenException);
    });

    it('6b.2: a timestamp supply date is the franchise\'s local day, as the engine reads it', async () => {
      // 2026-10-24 19:30 UTC = 2026-10-25 01:00 IST; plain dates are kept
      await expect(preview({ billingCountryCode: 'US', supplyDate: '2026-10-24T19:30:00.000Z' })).resolves.toMatchObject({ facts: { supplyDate: '2026-10-25' } });
      await expect(preview({ franchiseId: 2, billingCountryCode: 'US', supplyDate: '2026-10-24T19:30:00.000Z' })).resolves.toMatchObject({ facts: { supplyDate: '2026-10-24' } });
      await expect(preview({ billingCountryCode: 'US', supplyDate: '2026-10-24' })).resolves.toMatchObject({ facts: { supplyDate: '2026-10-24' } });
    });
  });

  describe('franchise scope (plan 3.2 / 3b)', () => {
    it("lists only the admin's franchises; a super admin sees all, mapped or not; an unmapped admin sees none", async () => {
      const franchisesOf = async (user: IAuthUser) => [...new Set((await service.findAll({ page: 0, limit: 50 } as never, user)).tableData.map((rule) => rule.franchiseId))].sort();
      await expect(franchisesOf(efmumAdmin)).resolves.toEqual([1]);
      await expect(franchisesOf(superAdmin)).resolves.toEqual([1, 2, 3]);
      await expect(franchisesOf(mappedSuperAdmin)).resolves.toEqual([1, 2, 3]);
      await expect(franchisesOf(unmappedAdmin)).resolves.toEqual([]);
    });

    it('details, create, update and status of another franchise → 403, nothing written', async () => {
      await expect(service.fetchById(2, efmumAdmin)).rejects.toThrow(ForbiddenException);
      await expect(service.create(post({ franchiseId: 2 }), 'ip', efmumAdmin)).rejects.toThrow(ForbiddenException);
      await expect(service.update(2, post({ franchiseId: 2 }), 'ip', efmumAdmin)).rejects.toThrow(ForbiddenException);
      await expect(service.update(1, post({ franchiseId: 2 }), 'ip', efmumAdmin)).rejects.toThrow(ForbiddenException);
      await expect(service.changeStatus(2, false, 'ip', efmumAdmin)).rejects.toThrow(ForbiddenException);
      await expect(service.fetchById(1, unmappedAdmin)).rejects.toThrow(ForbiddenException);
      expect(rules.model.create).not.toHaveBeenCalled();
      expect(rules.model.update).not.toHaveBeenCalled();
    });

    it("the admin's own franchise is writable", async () => {
      await expect(service.create(post(), 'ip', efmumAdmin)).resolves.toBeDefined();
      expect(rules.rows.at(-1)).toMatchObject({ franchiseId: 1, createdBy: 21 });
      await expect(service.changeStatus(6, false, 'ip', efmumAdmin)).resolves.toBeUndefined();
    });
  });

  it('every refusal is a BadRequestException (a 400, never a database error)', async () => {
    await expect(service.create(post({ customerScope: CustomerScopeEnum.SPECIFIC_COUNTRY, placeOfSupplyCountryCode: 'IN' }), 'ip', superAdmin)).rejects.toThrow(BadRequestException);
  });
});
