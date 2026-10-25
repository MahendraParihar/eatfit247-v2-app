import {
  CustomerScopeEnum,
  CustomerTypeConditionEnum,
  ElectronicConditionEnum,
  ITaxRuleDraft,
  MoneyConditionEnum,
  RegistrationConditionEnum,
  RuleAppliesToEnum,
  StateRelationEnum,
  TaxCategoryEnum,
  TaxRuleGuardrailsUtil,
  TaxTreatmentEnum,
  TaxTypeEnum,
  TransactionType,
} from '@eatfit247-shared-lib';

/** EFMUM's default service rule (GST 18%), today's shape, with overrides. */
const rule = (overrides: Partial<ITaxRuleDraft> = {}): ITaxRuleDraft => ({
  id: null,
  franchiseId: 1,
  countryCode: 'IN',
  transactionType: TransactionType.SERVICE,
  referenceId: 1,
  taxSystem: TaxTypeEnum.GST,
  taxCode: 'GST_18',
  taxName: 'GST 18%',
  taxPercent: 18,
  isTaxInclusive: false,
  taxCategory: TaxCategoryEnum.STANDARD,
  hsnSacCode: '999319',
  legalBasis: null,
  effectiveFrom: '2017-04-28',
  effectiveTo: null,
  active: true,
  customerScope: CustomerScopeEnum.SAME_COUNTRY,
  placeOfSupplyCountryCode: null,
  stateRelation: StateRelationEnum.ANY,
  registrationCondition: RegistrationConditionEnum.ANY,
  customerTypeCondition: CustomerTypeConditionEnum.ANY,
  electronicCondition: ElectronicConditionEnum.ANY,
  moneyCondition: MoneyConditionEnum.ANY,
  appliesTo: RuleAppliesToEnum.ALL,
  treatment: TaxTreatmentEnum.CHARGE,
  refusalMessage: null,
  invoiceNote: null,
  requiresEvidence: false,
  fallbackTaxMasterId: null,
  fallbackOnly: false,
  ...overrides,
});
const uaeVat = (overrides: Partial<ITaxRuleDraft> = {}) =>
  rule({ franchiseId: 2, countryCode: 'AE', taxSystem: TaxTypeEnum.VAT, taxPercent: 0, taxCategory: TaxCategoryEnum.ZERO_RATED, effectiveFrom: '2025-12-31', ...overrides });
const codes = (draft: ITaxRuleDraft) => TaxRuleGuardrailsUtil.blocks(draft).map((block) => block.code);
const warnings = (draft: ITaxRuleDraft, seeded = false) => TaxRuleGuardrailsUtil.warnings(draft, { seeded }).map((warning) => warning.code);

/** Configurable tax treatment, plan 5.2 (decision 7; A8, A12a, A31). */
describe('TaxRuleGuardrailsUtil', () => {
  it('today\'s rules and the seeded ones have no block', () => {
    expect(codes(rule())).toEqual([]);
    expect(codes(rule({ customerScope: CustomerScopeEnum.ANY_FOREIGN, moneyCondition: MoneyConditionEnum.FOREIGN, treatment: TaxTreatmentEnum.EXPORT_LUT_OR_TAX, referenceId: 0 }))).toEqual([]);
    expect(codes(uaeVat({ customerScope: CustomerScopeEnum.ANY_FOREIGN, treatment: TaxTreatmentEnum.ZERO_RATED_EXPORT, requiresEvidence: true, fallbackTaxMasterId: 9 }))).toEqual([]);
    expect(
      codes(rule({ franchiseId: 3, transactionType: TransactionType.PRODUCT, taxSystem: TaxTypeEnum.NONE, taxPercent: 0, stateRelation: StateRelationEnum.OTHER, registrationCondition: RegistrationConditionEnum.UNREGISTERED, treatment: TaxTreatmentEnum.REFUSE, refusalMessage: 'No.' })),
    ).toEqual([]);
  });

  describe('hard blocks (each a 400)', () => {
    it.each<[string, Partial<ITaxRuleDraft>, string]>([
      ['GST outside India', { countryCode: 'AE' }, 'GST_OUTSIDE_INDIA'],
      ['the LUT treatment on VAT', { franchiseId: 2, countryCode: 'AE', taxSystem: TaxTypeEnum.VAT, taxPercent: 5, customerScope: CustomerScopeEnum.ANY_FOREIGN, treatment: TaxTreatmentEnum.EXPORT_LUT_OR_TAX }, 'LUT_NEEDS_GST'],
      ['an export treatment for same-country customers', { treatment: TaxTreatmentEnum.EXPORT_LUT_OR_TAX }, 'EXPORT_NEEDS_FOREIGN_SCOPE'],
      ['out of scope for scope ANY (it could match a domestic sale)', { customerScope: CustomerScopeEnum.ANY, treatment: TaxTreatmentEnum.OUT_OF_SCOPE }, 'EXPORT_NEEDS_FOREIGN_SCOPE'],
      ['zero-rated export on GST', { customerScope: CustomerScopeEnum.ANY_FOREIGN, treatment: TaxTreatmentEnum.ZERO_RATED_EXPORT }, 'ZERO_RATED_NEEDS_VAT'],
      ['a money condition on goods', { transactionType: TransactionType.PRODUCT, moneyCondition: MoneyConditionEnum.DOMESTIC }, 'MONEY_ON_GOODS'],
      ['a specific country without the country', { customerScope: CustomerScopeEnum.SPECIFIC_COUNTRY }, 'SPECIFIC_COUNTRY_MISSING'],
      ['a specific country equal to the supplier\'s', { customerScope: CustomerScopeEnum.SPECIFIC_COUNTRY, placeOfSupplyCountryCode: 'in' }, 'SPECIFIC_COUNTRY_IS_SUPPLIER'],
      ['a country on a non-specific rule', { placeOfSupplyCountryCode: 'US' }, 'COUNTRY_WITHOUT_SPECIFIC_SCOPE'],
      ['a State condition on a foreign scope', { customerScope: CustomerScopeEnum.ANY_FOREIGN, stateRelation: StateRelationEnum.OTHER }, 'STATE_ON_FOREIGN_SCOPE'],
      ['VAT for an unregistered supplier', { franchiseId: 2, countryCode: 'AE', taxSystem: TaxTypeEnum.VAT, taxPercent: 5, registrationCondition: RegistrationConditionEnum.UNREGISTERED }, 'VAT_UNREGISTERED'],
      ['a rate above 100', { taxPercent: 101 }, 'RATE_RANGE'],
      ['a negative rate', { taxPercent: -1 }, 'RATE_RANGE'],
      ['0% VAT marked standard', { franchiseId: 2, countryCode: 'AE', taxSystem: TaxTypeEnum.VAT, taxPercent: 0 }, 'VAT_ZERO_STANDARD'],
      ['5% VAT marked zero-rated', { franchiseId: 2, countryCode: 'AE', taxSystem: TaxTypeEnum.VAT, taxPercent: 5, taxCategory: TaxCategoryEnum.ZERO_RATED }, 'VAT_RATE_NOT_STANDARD'],
      ['a refusal without a message', { treatment: TaxTreatmentEnum.REFUSE }, 'REFUSE_NEEDS_MESSAGE'],
      ['foreign registration without its country', { customerScope: CustomerScopeEnum.ANY_FOREIGN, treatment: TaxTreatmentEnum.FOREIGN_REGISTRATION }, 'FOREIGN_REGISTRATION_NEEDS_COUNTRY'],
      ['evidence without a fallback', { requiresEvidence: true }, 'EVIDENCE_NEEDS_FALLBACK'],
      ['a fallback-only rule requiring evidence', { requiresEvidence: true, fallbackTaxMasterId: 9, fallbackOnly: true }, 'FALLBACK_WITH_EVIDENCE'],
      ['its own fallback', { id: 9, fallbackTaxMasterId: 9 }, 'FALLBACK_SELF'],
      ['a specific rule without a plan / product', { appliesTo: RuleAppliesToEnum.SPECIFIC, referenceId: 0 }, 'SPECIFIC_NEEDS_REFERENCE'],
    ])('%s', (_label, overrides, expected) => {
      expect(codes(rule(overrides))).toContain(expected);
    });

    it('A12a shape: "customer AE, electronic → FOREIGN_REGISTRATION" is structurally fine; the registration is checked in the service', () => {
      expect(codes(rule({ customerScope: CustomerScopeEnum.SPECIFIC_COUNTRY, placeOfSupplyCountryCode: 'AE', electronicCondition: ElectronicConditionEnum.YES, treatment: TaxTreatmentEnum.FOREIGN_REGISTRATION, taxSystem: TaxTypeEnum.VAT, countryCode: 'IN', taxPercent: 5 }))).toEqual([]);
    });
  });

  describe('warnings (saving needs a legal basis)', () => {
    it.each<[string, Partial<ITaxRuleDraft>, string]>([
      ['LUT export not limited to registered suppliers', { customerScope: CustomerScopeEnum.ANY_FOREIGN, moneyCondition: MoneyConditionEnum.FOREIGN, treatment: TaxTreatmentEnum.EXPORT_LUT_OR_TAX }, 'LUT_NOT_LIMITED_TO_REGISTERED'],
      ['IGST charged on a foreign-money sale abroad', { customerScope: CustomerScopeEnum.ANY_FOREIGN, moneyCondition: MoneyConditionEnum.FOREIGN }, 'GST_ON_FOREIGN_MONEY_SALE'],
      ['a refusal', { treatment: TaxTreatmentEnum.REFUSE, refusalMessage: 'No.' }, 'REFUSAL'],
    ])('%s', (_label, overrides, expected) => {
      expect(warnings(rule(overrides))).toContain(expected);
    });

    it('IGST on foreign money also when the money condition is ANY, or the scope ANY; not for the DOMESTIC-money rule (5b.3)', () => {
      expect(warnings(rule({ customerScope: CustomerScopeEnum.ANY_FOREIGN }))).toContain('GST_ON_FOREIGN_MONEY_SALE');
      expect(warnings(rule({ customerScope: CustomerScopeEnum.ANY }))).toContain('GST_ON_FOREIGN_MONEY_SALE');
      expect(warnings(rule({ customerScope: CustomerScopeEnum.ANY_FOREIGN, moneyCondition: MoneyConditionEnum.DOMESTIC }))).toEqual([]);
      expect(warnings(rule())).toEqual([]);
    });

    it('a zero-rated or out-of-scope export, and 0% domestic VAT', () => {
      expect(warnings(uaeVat({ customerScope: CustomerScopeEnum.ANY_FOREIGN, treatment: TaxTreatmentEnum.ZERO_RATED_EXPORT }))).toContain('ZERO_RATED_OR_OUT_OF_SCOPE_EXPORT');
      expect(warnings(uaeVat())).toContain('ZERO_DOMESTIC_VAT');
      expect(warnings(uaeVat({ taxPercent: 5, taxCategory: TaxCategoryEnum.STANDARD }))).toEqual([]);
    });

    it('LUT limited to registered suppliers has no LUT warning; an edit of a seeded row always warns', () => {
      expect(warnings(rule({ customerScope: CustomerScopeEnum.ANY_FOREIGN, moneyCondition: MoneyConditionEnum.FOREIGN, treatment: TaxTreatmentEnum.EXPORT_LUT_OR_TAX, registrationCondition: RegistrationConditionEnum.REGISTERED }))).toEqual([]);
      expect(warnings(rule(), true)).toEqual(['SEEDED_RULE_EDIT']);
      expect(warnings(rule())).toEqual([]);
    });
  });

  describe('fallback (A31)', () => {
    const zeroRated = uaeVat({ id: 10, customerScope: CustomerScopeEnum.ANY_FOREIGN, treatment: TaxTreatmentEnum.ZERO_RATED_EXPORT, requiresEvidence: true, fallbackTaxMasterId: 9, referenceId: 0 });
    const fallback = { ...uaeVat({ customerScope: CustomerScopeEnum.ANY_FOREIGN, taxPercent: 5, taxCategory: TaxCategoryEnum.STANDARD, fallbackOnly: true, referenceId: 0 }), id: 9 };
    const fallbackCodes = (fb: typeof fallback, r = zeroRated) => TaxRuleGuardrailsUtil.fallbackBlocks(r, fb).map((block) => block.code);

    it('accepts the seeded fallback-only 5% rule', () => {
      expect(fallbackCodes(fallback)).toEqual([]);
    });

    it('accepts an "any foreign" fallback for a specific-country rule, and an ALL fallback for a plan rule', () => {
      expect(fallbackCodes(fallback, { ...zeroRated, customerScope: CustomerScopeEnum.SPECIFIC_COUNTRY, placeOfSupplyCountryCode: 'US', appliesTo: RuleAppliesToEnum.SPECIFIC, referenceId: 263 })).toEqual([]);
    });

    it.each<[string, Partial<typeof fallback>, string]>([
      ['a normal rule', { fallbackOnly: false }, 'FALLBACK_NOT_FALLBACK_ONLY'],
      ['an inactive rule', { active: false }, 'FALLBACK_INACTIVE'],
      ['another franchise\'s rule', { franchiseId: 1 }, 'FALLBACK_OTHER_RULE_SET'],
      ['a goods rule', { transactionType: TransactionType.PRODUCT }, 'FALLBACK_OTHER_RULE_SET'],
      ['a rule that needs evidence', { requiresEvidence: true, fallbackTaxMasterId: 3 }, 'FALLBACK_NEEDS_EVIDENCE'],
      ['a rule for B2B only (does not cover every sale)', { customerTypeCondition: CustomerTypeConditionEnum.B2B }, 'FALLBACK_NOT_EXECUTABLE'],
      ['a rule for one specific country', { customerScope: CustomerScopeEnum.SPECIFIC_COUNTRY, placeOfSupplyCountryCode: 'US' }, 'FALLBACK_NOT_EXECUTABLE'],
      ['a rule for one plan', { appliesTo: RuleAppliesToEnum.SPECIFIC, referenceId: 263 }, 'FALLBACK_NOT_EXECUTABLE'],
      ['a rule starting after the rule it backs', { effectiveFrom: '2026-06-01' }, 'FALLBACK_DATES'],
      ['a rule ending while the rule it backs is open-ended', { effectiveTo: '2026-12-31' }, 'FALLBACK_DATES'],
    ])('refuses %s', (_label, overrides, expected) => {
      expect(fallbackCodes({ ...fallback, ...overrides })).toContain(expected);
    });
  });
});
