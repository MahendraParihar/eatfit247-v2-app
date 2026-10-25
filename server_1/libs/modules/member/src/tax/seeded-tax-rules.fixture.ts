import { CountryService } from '@server_1/platform';
import { MstFranchise } from '@server_1/core';
import {
  IndiaGstService,
  LutService,
  TaxEngineService,
  TaxMasterService,
  TaxRegistrationService,
  UsSalesTaxService,
  VatService,
} from '@server_1/modules/tax-engine';
import { TaxTypeEnum } from '@eatfit247-shared-lib';

/**
 * The Tax Master rules of migration 146 on the local DB (rows 1–11, configurable tax treatment plan 6.6): the
 * 144 rate rows (1–4; row 4 the staged MEMUM 5%, inactive) and the 146 seeds (5–11). The engine specs run the
 * real resolver (`TaxMasterService.resolve`) over a copy of these rows, so they also document the seed.
 */
export interface SeedRule {
  id: number;
  franchiseId: number;
  countryCode: string;
  transactionType: string;
  referenceId: number;
  appliesTo: string;
  customerScope: string;
  placeOfSupplyCountryCode: string | null;
  stateRelation: string;
  registrationCondition: string;
  customerTypeCondition: string;
  electronicCondition: string;
  moneyCondition: string;
  treatment: string;
  taxSystem: TaxTypeEnum;
  taxCode: string;
  taxPercent: number;
  isTaxInclusive: boolean;
  taxCategory: string;
  hsnSacCode: string | null;
  invoiceNote: string | null;
  refusalMessage: string | null;
  requiresEvidence: boolean;
  fallbackTaxMasterId: number | null;
  fallbackOnly: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  active: boolean;
}

export const EFMUM = 1;
export const HCUAE = 2;
export const MEMUM = 3;

const base = {
  placeOfSupplyCountryCode: null,
  stateRelation: 'ANY',
  registrationCondition: 'ANY',
  customerTypeCondition: 'ANY',
  electronicCondition: 'ANY',
  moneyCondition: 'ANY',
  invoiceNote: null,
  refusalMessage: null,
  requiresEvidence: false,
  fallbackTaxMasterId: null,
  fallbackOnly: false,
  effectiveTo: null,
  active: true,
};

export function seededRules(): SeedRule[] {
  const rows = [
    // 144: EFMUM's default service rule, GST 18%
    { id: 1, franchiseId: EFMUM, countryCode: 'IN ', transactionType: 'SERVICE', referenceId: 1, appliesTo: 'ALL', customerScope: 'SAME_COUNTRY', treatment: 'CHARGE', taxSystem: TaxTypeEnum.GST, taxCode: 'GST_18', taxPercent: 18, isTaxInclusive: false, taxCategory: 'STANDARD', hsnSacCode: '999319', effectiveFrom: '2015-12-31' },
    // 144: HCUAE's default service rule, VAT 0% zero-rated (Art 41, adviser item)
    { id: 2, franchiseId: HCUAE, countryCode: 'AE ', transactionType: 'SERVICE', referenceId: 1, appliesTo: 'ALL', customerScope: 'SAME_COUNTRY', treatment: 'CHARGE', taxSystem: TaxTypeEnum.VAT, taxCode: 'VAT_0', taxPercent: 0, isTaxInclusive: false, taxCategory: 'ZERO_RATED', hsnSacCode: '999319', effectiveFrom: '2025-12-31' },
    // 144: MEMUM product 1, GST 12% inclusive (priced without GST while unregistered)
    { id: 3, franchiseId: MEMUM, countryCode: 'IN ', transactionType: 'PRODUCT', referenceId: 1, appliesTo: 'SPECIFIC', customerScope: 'SAME_COUNTRY', treatment: 'CHARGE', taxSystem: TaxTypeEnum.GST, taxCode: 'GST_12', taxPercent: 12, isTaxInclusive: true, taxCategory: 'STANDARD', hsnSacCode: '3004', effectiveFrom: '2015-12-31' },
    // 144: MEMUM product 1, GST 5% from 2025-09-22, staged (inactive until the CA confirms the registration)
    { id: 4, franchiseId: MEMUM, countryCode: 'IN ', transactionType: 'PRODUCT', referenceId: 1, appliesTo: 'SPECIFIC', customerScope: 'SAME_COUNTRY', treatment: 'CHARGE', taxSystem: TaxTypeEnum.GST, taxCode: 'GST_5', taxPercent: 5, isTaxInclusive: false, taxCategory: 'STANDARD', hsnSacCode: '3004', effectiveFrom: '2025-09-22', active: false },
    // 146: EFMUM services abroad, foreign money → export (0% under LUT, else IGST)
    { id: 5, franchiseId: EFMUM, countryCode: 'IN', transactionType: 'SERVICE', referenceId: 0, appliesTo: 'ALL', customerScope: 'ANY_FOREIGN', moneyCondition: 'FOREIGN', treatment: 'EXPORT_LUT_OR_TAX', taxSystem: TaxTypeEnum.GST, taxCode: 'EXPORT_LUT', taxPercent: 18, isTaxInclusive: false, taxCategory: 'STANDARD', hsnSacCode: '999319', effectiveFrom: '2015-12-31' },
    // 146: EFMUM services abroad, INR over Indian rails → IGST, not an export
    { id: 6, franchiseId: EFMUM, countryCode: 'IN', transactionType: 'SERVICE', referenceId: 0, appliesTo: 'ALL', customerScope: 'ANY_FOREIGN', moneyCondition: 'DOMESTIC', treatment: 'CHARGE', taxSystem: TaxTypeEnum.GST, taxCode: 'IGST_ABROAD_INR', taxPercent: 18, isTaxInclusive: false, taxCategory: 'STANDARD', hsnSacCode: '999319', effectiveFrom: '2015-12-31' },
    // 146: MEMUM goods to another (or an unknown) State while unregistered → refused (CGST s.24(i))
    { id: 7, franchiseId: MEMUM, countryCode: 'IN', transactionType: 'PRODUCT', referenceId: 0, appliesTo: 'ALL', customerScope: 'SAME_COUNTRY', stateRelation: 'OTHER', registrationCondition: 'UNREGISTERED', treatment: 'REFUSE', taxSystem: TaxTypeEnum.NONE, taxCode: 'REFUSE_S24', taxPercent: 0, isTaxInclusive: false, taxCategory: 'STANDARD', hsnSacCode: null, refusalMessage: 'Inter-state goods supply needs GST registration (CGST s.24(i)). Ask the CA, or deliver within the franchise state.', effectiveFrom: '2017-07-01' },
    // 146: MEMUM product 1 abroad → export, twin of row 3
    { id: 8, franchiseId: MEMUM, countryCode: 'IN', transactionType: 'PRODUCT', referenceId: 1, appliesTo: 'SPECIFIC', customerScope: 'ANY_FOREIGN', treatment: 'EXPORT_LUT_OR_TAX', taxSystem: TaxTypeEnum.GST, taxCode: 'EXPORT_GOODS', taxPercent: 12, isTaxInclusive: true, taxCategory: 'STANDARD', hsnSacCode: '3004', effectiveFrom: '2015-12-31' },
    // 146: HCUAE's fallback (never matched directly): VAT 5% standard when the Art 31 evidence fails
    { id: 9, franchiseId: HCUAE, countryCode: 'AE', transactionType: 'SERVICE', referenceId: 0, appliesTo: 'ALL', customerScope: 'ANY_FOREIGN', treatment: 'CHARGE', taxSystem: TaxTypeEnum.VAT, taxCode: 'VAT_5_FALLBACK', taxPercent: 5, isTaxInclusive: false, taxCategory: 'STANDARD', hsnSacCode: '999319', fallbackOnly: true, effectiveFrom: '2025-12-31' },
    // 146: HCUAE services abroad → zero-rated export (Art 31), evidence required, fallback row 9
    { id: 10, franchiseId: HCUAE, countryCode: 'AE', transactionType: 'SERVICE', referenceId: 0, appliesTo: 'ALL', customerScope: 'ANY_FOREIGN', treatment: 'ZERO_RATED_EXPORT', taxSystem: TaxTypeEnum.VAT, taxCode: 'VAT_0_EXPORT', taxPercent: 0, isTaxInclusive: false, taxCategory: 'ZERO_RATED', hsnSacCode: '999319', invoiceNote: 'Zero-rated supply of services to a recipient outside the UAE.', requiresEvidence: true, fallbackTaxMasterId: 9, effectiveFrom: '2025-12-31' },
    // 146: HCUAE goods abroad → zero-rated export (Art 30)
    { id: 11, franchiseId: HCUAE, countryCode: 'AE', transactionType: 'PRODUCT', referenceId: 0, appliesTo: 'ALL', customerScope: 'ANY_FOREIGN', treatment: 'ZERO_RATED_EXPORT', taxSystem: TaxTypeEnum.VAT, taxCode: 'VAT_0_EXPORT_GOODS', taxPercent: 0, isTaxInclusive: false, taxCategory: 'ZERO_RATED', hsnSacCode: null, invoiceNote: 'Zero-rated export of goods to a destination outside the UAE.', effectiveFrom: '2025-12-31' },
  ];
  return rows.map((row) => ({ ...base, ...row }) as unknown as SeedRule);
}

/** A rule for a test: the defaults of today's form (same country, every condition ANY, CHARGE) plus `fields`. */
export function rule(fields: Partial<SeedRule> & Pick<SeedRule, 'id' | 'franchiseId' | 'countryCode' | 'transactionType'>): SeedRule {
  return {
    ...base,
    referenceId: 0,
    appliesTo: 'ALL',
    customerScope: 'SAME_COUNTRY',
    treatment: 'CHARGE',
    taxSystem: TaxTypeEnum.NONE,
    taxCode: `TEST_${fields.id}`,
    taxPercent: 0,
    isTaxInclusive: false,
    taxCategory: 'STANDARD',
    hsnSacCode: null,
    effectiveFrom: '2015-01-01',
    ...fields,
  } as unknown as SeedRule;
}

/** A franchise's registrations, as `TaxRegistrationService.findActive` returns them on a date. */
export interface FixtureRegistration {
  taxRegistrationId: number;
  taxSystem: TaxTypeEnum;
  countryCode: string;
}

export interface EngineHarness {
  engine: TaxEngineService;
  taxMaster: TaxMasterService;
  rules: SeedRule[];
  /** franchise id → its active registrations */
  registrations: Record<number, FixtureRegistration[]>;
  /** program plan ids flagged `is_electronic_service` */
  electronicPlans: Set<number>;
  /** franchise id → time zone and working currency */
  franchises: Record<number, { franchiseId: number; timeZone: string; currencyCode: string | null }>;
  findValid: jest.Mock;
  findActive: jest.Mock;
  resolveOrThrow: jest.SpyInstance;
}

/**
 * The engine on the seeded rules: the real `TaxMasterService` resolver over an in-memory `mst_tax_master`, the real
 * GST / VAT calculators, and fakes for registrations, LUTs, franchises and countries.
 */
export function engineHarness(options: { lut?: (franchiseId: number, date: string) => { arn: string } | null } = {}): EngineHarness {
  const rules = seededRules();
  const registrations: Record<number, FixtureRegistration[]> = {
    [EFMUM]: [{ taxRegistrationId: 1, taxSystem: TaxTypeEnum.GST, countryCode: 'IN' }],
    [HCUAE]: [{ taxRegistrationId: 2, taxSystem: TaxTypeEnum.VAT, countryCode: 'AE' }],
    [MEMUM]: [],
  };
  const electronicPlans = new Set<number>();
  const franchises: Record<number, { franchiseId: number; timeZone: string; currencyCode: string | null }> = {
    [EFMUM]: { franchiseId: EFMUM, timeZone: 'Asia/Kolkata', currencyCode: 'INR' },
    [HCUAE]: { franchiseId: HCUAE, timeZone: 'Asia/Dubai', currencyCode: 'AED' },
    [MEMUM]: { franchiseId: MEMUM, timeZone: 'Asia/Kolkata', currencyCode: 'INR' },
  };
  const ruleStore = {
    findAll: jest.fn().mockImplementation(async ({ where }: { where: { franchiseId: number; transactionType: string; active: boolean } }) =>
      rules.filter((r) => r.franchiseId === where.franchiseId && r.transactionType === where.transactionType && r.active === where.active),
    ),
  };
  const sequelize = {
    query: jest.fn().mockImplementation(async (_sql: string, opts: { replacements: { programPlanId: number } }) => [
      { electronic: electronicPlans.has(Number(opts.replacements.programPlanId)) },
    ]),
  };
  const taxMaster = new TaxMasterService(ruleStore as never, {} as never, {} as never, {} as never, sequelize as never);
  const resolveOrThrow = jest.spyOn(taxMaster, 'resolveOrThrow');
  const findValid = jest.fn().mockImplementation(async (franchiseId: number, date: string) => options.lut?.(franchiseId, date) ?? null);
  const findActive = jest.fn().mockImplementation(async (franchiseId: number) => registrations[franchiseId] ?? []);
  const engine = new TaxEngineService(
    new IndiaGstService(),
    new VatService(),
    { calculate: jest.fn() } as unknown as UsSalesTaxService,
    {
      findAll: jest.fn().mockResolvedValue({
        tableData: [
          { countryCode: 'IN', country: 'India' },
          { countryCode: 'US', country: 'United States' },
          { countryCode: 'AE', country: 'United Arab Emirates' },
          { countryCode: 'SA', country: 'Saudi Arabia' },
        ],
        count: 4,
      }),
    } as unknown as CountryService,
    taxMaster,
    { findValid } as unknown as LutService,
    { findByPk: jest.fn().mockImplementation(async (id: number) => franchises[id] ?? null) } as unknown as typeof MstFranchise,
    { findActive } as unknown as TaxRegistrationService,
  );
  return { engine, taxMaster, rules, registrations, electronicPlans, franchises, findValid, findActive, resolveOrThrow };
}

/** The seeded (or test) rule with this id; throws when it isn't in the store. */
export function ruleById(rules: SeedRule[], id: number): SeedRule {
  const found = rules.find((r) => r.id === id);
  if (!found) {
    throw new Error(`No rule ${id} in the fixture`);
  }
  return found;
}
