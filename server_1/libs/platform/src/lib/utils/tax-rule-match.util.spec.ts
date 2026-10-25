import {
  CustomerScopeEnum,
  CustomerTypeConditionEnum,
  CustomerTypeEnum,
  ElectronicConditionEnum,
  ITaxRuleFacts,
  ITaxRuleMatchable,
  MoneyConditionEnum,
  MoneyOriginEnum,
  PaymentRouteEnum,
  RegistrationConditionEnum,
  RuleAppliesToEnum,
  StateRelationEnum,
  TaxRegistrationNumberUtil,
  TaxRuleMatchUtil,
  TransactionType,
} from '@eatfit247-shared-lib';

const EFMUM = 1;
const HCUAE = 2;
const MEMUM = 3;

type Rule = ITaxRuleMatchable & { id: number; treatment: string };

/** Today's shape (migration 146 defaults) with overrides. */
const rule = (id: number, overrides: Partial<Rule>): Rule => ({
  id,
  franchiseId: EFMUM,
  countryCode: 'IN ',
  transactionType: TransactionType.SERVICE,
  referenceId: 0,
  customerScope: CustomerScopeEnum.SAME_COUNTRY,
  placeOfSupplyCountryCode: null,
  stateRelation: StateRelationEnum.ANY,
  registrationCondition: RegistrationConditionEnum.ANY,
  customerTypeCondition: CustomerTypeConditionEnum.ANY,
  electronicCondition: ElectronicConditionEnum.ANY,
  moneyCondition: MoneyConditionEnum.ANY,
  appliesTo: RuleAppliesToEnum.ALL,
  effectiveFrom: '2015-12-31',
  effectiveTo: null,
  active: true,
  fallbackOnly: false,
  treatment: 'CHARGE',
  ...overrides,
});

const product = { transactionType: TransactionType.PRODUCT };
const foreign = { customerScope: CustomerScopeEnum.ANY_FOREIGN };
const uae = { franchiseId: HCUAE, countryCode: 'AE ', effectiveFrom: '2025-12-31' };
const mahi = { franchiseId: MEMUM, ...product };

/** The rules migration 146 leaves on the local DB (ids as there). */
const SEEDED: Rule[] = [
  rule(1, { referenceId: 1 }), // EFMUM GST 18%
  rule(2, { ...uae, referenceId: 1 }), // HCUAE VAT 0% Z (Art 41)
  rule(3, { ...mahi, referenceId: 1, appliesTo: RuleAppliesToEnum.SPECIFIC }), // MEMUM product 1 GST 12%
  rule(4, { ...mahi, referenceId: 1, appliesTo: RuleAppliesToEnum.SPECIFIC, effectiveFrom: '2025-09-22', active: false }), // staged GST 5%
  rule(5, { ...foreign, moneyCondition: MoneyConditionEnum.FOREIGN, treatment: 'EXPORT_LUT_OR_TAX' }),
  rule(6, { ...foreign, moneyCondition: MoneyConditionEnum.DOMESTIC, treatment: 'CHARGE' }), // IGST, not an export
  rule(7, {
    ...mahi,
    stateRelation: StateRelationEnum.OTHER,
    registrationCondition: RegistrationConditionEnum.UNREGISTERED,
    effectiveFrom: '2017-07-01',
    treatment: 'REFUSE',
  }),
  rule(8, { ...mahi, ...foreign, referenceId: 1, appliesTo: RuleAppliesToEnum.SPECIFIC, treatment: 'EXPORT_LUT_OR_TAX' }),
  rule(9, { ...uae, ...foreign, fallbackOnly: true, treatment: 'CHARGE' }), // VAT 5% fallback
  rule(10, { ...uae, ...foreign, treatment: 'ZERO_RATED_EXPORT' }),
  rule(11, { ...uae, ...product, ...foreign, treatment: 'ZERO_RATED_EXPORT' }),
];
const byId = (id: number): Rule => SEEDED.find((r) => r.id === id) as Rule;

const facts = (overrides: Partial<ITaxRuleFacts>): ITaxRuleFacts => ({
  franchiseId: EFMUM,
  supplierCountryCode: 'IN',
  supplierStateCode: '27',
  transactionType: TransactionType.SERVICE,
  referenceId: 263,
  placeOfSupplyCountryCode: 'IN',
  placeOfSupplyStateCode: '27',
  registered: true,
  customerType: CustomerTypeEnum.B2C,
  electronic: false,
  money: MoneyOriginEnum.DOMESTIC,
  supplyDate: '2026-10-25',
  ...overrides,
});
const efmum = (overrides: Partial<ITaxRuleFacts>) => facts(overrides);
const memum = (overrides: Partial<ITaxRuleFacts>) =>
  facts({ franchiseId: MEMUM, transactionType: TransactionType.PRODUCT, referenceId: 1, registered: false, money: null, ...overrides });
const hcuae = (overrides: Partial<ITaxRuleFacts>) =>
  facts({ franchiseId: HCUAE, supplierCountryCode: 'AE', supplierStateCode: 'AE-DU', placeOfSupplyCountryCode: 'AE', placeOfSupplyStateCode: 'AE-DU', money: null, ...overrides });

const winnerOf = (f: ITaxRuleFacts, rules: Rule[] = SEEDED): number | null => TaxRuleMatchUtil.resolve(rules, f).winner?.id ?? null;

/** Configurable tax treatment, plan 2.3 (decisions 3 and 4). */
describe('TaxRuleMatchUtil', () => {
  describe('every seeded rule wins its own sale (today\'s outcomes, decision 5)', () => {
    it.each<[string, ITaxRuleFacts, number | null]>([
      ['EFMUM, client in Maharashtra (matrix row 1): GST rule', efmum({}), 1],
      ['EFMUM, client in Karnataka (row 2): the same rule (IGST by State is the executor\'s)', efmum({ placeOfSupplyStateCode: '29' }), 1],
      ['EFMUM, plan-less reference 1 too', efmum({ referenceId: 1 }), 1],
      ['EFMUM, US client, foreign money (row 5): export under LUT or IGST', efmum({ placeOfSupplyCountryCode: 'US', placeOfSupplyStateCode: null, money: MoneyOriginEnum.FOREIGN }), 5],
      ['EFMUM, US client paying INR in India (row 6): IGST, not an export', efmum({ placeOfSupplyCountryCode: 'US', placeOfSupplyStateCode: null }), 6],
      ['MEMUM, delivery in Maharashtra, unregistered (row 4u): the product rate row', memum({}), 3],
      ['MEMUM, delivery in Telangana, unregistered: REFUSE (s.24(i))', memum({ placeOfSupplyStateCode: '36' }), 7],
      ['MEMUM, delivery in India with no State, unregistered: REFUSE (unknown = other)', memum({ placeOfSupplyStateCode: null }), 7],
      ['MEMUM, delivery in Telangana once registered (row 4): the product rate row', memum({ placeOfSupplyStateCode: '36', registered: true }), 3],
      ['MEMUM, delivery in the US (row 7): export of goods', memum({ placeOfSupplyCountryCode: 'US', placeOfSupplyStateCode: null }), 8],
      ['MEMUM, a product without its own rule: no rule', memum({ referenceId: 2 }), null],
      ['HCUAE, UAE client (row 8): the Art 41 rule', hcuae({}), 2],
      ['HCUAE, US client (row 10): zero-rated export, never the fallback', hcuae({ placeOfSupplyCountryCode: 'US', placeOfSupplyStateCode: null }), 10],
      ['HCUAE, goods to the US (row 11): zero-rated export of goods', hcuae({ transactionType: TransactionType.PRODUCT, placeOfSupplyCountryCode: 'US' }), 11],
      ['HCUAE, goods in the UAE: no rule (as today, none configured)', hcuae({ transactionType: TransactionType.PRODUCT }), null],
      ['HCUAE, a sale before its rules start: no rule', hcuae({ supplyDate: '2025-12-30' }), null],
    ])('%s', (_label, f, expected) => {
      expect(winnerOf(f)).toBe(expected);
    });

    it('matrix row 4: the s.24(i) REFUSE beats the product-specific rate row (conditions before "specific")', () => {
      const resolution = TaxRuleMatchUtil.resolve(SEEDED, memum({ placeOfSupplyStateCode: '36' }));
      expect(resolution.winner?.id).toBe(7);
      expect(resolution.runnersUp.map((r) => r.id)).toEqual([3]);
      expect(TaxRuleMatchUtil.shadowingWarnings(resolution)).toEqual([
        expect.objectContaining({ code: 'SPECIFIC_RULE_SHADOWED', message: expect.stringContaining('Rule 3') }),
      ]);
    });
  });

  describe('fallback-only rules', () => {
    it('are never matched, even when nothing else matches', () => {
      const onlyFallback = [byId(9)];
      expect(winnerOf(hcuae({ placeOfSupplyCountryCode: 'US' }), onlyFallback)).toBeNull();
    });

    it('are never a duplicate of their normal twin', () => {
      expect(TaxRuleMatchUtil.duplicates(byId(10), SEEDED)).toEqual([]); // rule 10 vs its fallback 9
      expect(TaxRuleMatchUtil.duplicates({ ...byId(9), id: null }, SEEDED)).toEqual([]); // a second fallback
    });
  });

  describe('D4 precedence', () => {
    const sa = rule(20, { ...foreign, customerScope: CustomerScopeEnum.SPECIFIC_COUNTRY, placeOfSupplyCountryCode: 'SA', ...uae });
    const anyForeignMoney = rule(21, { ...uae, ...foreign, moneyCondition: MoneyConditionEnum.FOREIGN });
    const anyForeignElectronic = rule(22, { ...uae, ...foreign, electronicCondition: ElectronicConditionEnum.YES });
    const saClient = hcuae({ placeOfSupplyCountryCode: 'SA', placeOfSupplyStateCode: null, money: MoneyOriginEnum.FOREIGN, electronic: true });

    it('{country = SA} beats {any foreign, money FOREIGN} for an SA client (dimension 1 before 6)', () => {
      expect(winnerOf(saClient, [anyForeignMoney, sa])).toBe(20);
    });

    it('{any foreign, electronic YES} does not beat {country = SA} (dimension 1 before 5)', () => {
      expect(winnerOf(saClient, [anyForeignElectronic, sa])).toBe(20);
    });

    it('{any foreign, electronic YES} beats {any foreign} for a US electronic plan, and not for a human-delivered one', () => {
      const us = hcuae({ placeOfSupplyCountryCode: 'US', placeOfSupplyStateCode: null });
      expect(winnerOf({ ...us, electronic: true }, [byId(10), anyForeignElectronic])).toBe(22);
      expect(winnerOf({ ...us, electronic: false }, [byId(10), anyForeignElectronic])).toBe(10);
    });

    it('a plan-specific rule beats an all-plans rule only when the conditions are equal', () => {
      const plan263 = rule(23, { referenceId: 263, appliesTo: RuleAppliesToEnum.SPECIFIC });
      expect(winnerOf(efmum({}), [SEEDED[0], plan263])).toBe(23);
      expect(winnerOf(efmum({ referenceId: 264 }), [SEEDED[0], plan263])).toBe(1);
      const unregisteredAll = rule(24, { registrationCondition: RegistrationConditionEnum.REGISTERED });
      expect(winnerOf(efmum({}), [plan263, unregisteredAll])).toBe(24);
    });

    it('a later effective_from takes over from its date only', () => {
      const staged = { ...SEEDED[3], active: true }; // MEMUM GST 5% from 2025-09-22
      expect(winnerOf(memum({ supplyDate: '2025-09-21' }), [SEEDED[2], staged])).toBe(3);
      expect(winnerOf(memum({ supplyDate: '2025-09-22' }), [SEEDED[2], staged])).toBe(4);
      expect(winnerOf(memum({}), SEEDED)).toBe(3); // the staged row is inactive
    });

    it('effective_to ends a rule on that day', () => {
      const ended = rule(25, { effectiveTo: '2026-03-31' });
      expect(winnerOf(efmum({ supplyDate: '2026-03-31' }), [ended])).toBe(25);
      expect(winnerOf(efmum({ supplyDate: '2026-04-01' }), [ended])).toBeNull();
    });

    it('B2B / B2C and State conditions', () => {
      const b2b = rule(26, { customerTypeCondition: CustomerTypeConditionEnum.B2B });
      const sameState = rule(27, { stateRelation: StateRelationEnum.SAME });
      expect(winnerOf(efmum({ customerType: CustomerTypeEnum.B2B }), [SEEDED[0], b2b])).toBe(26);
      expect(winnerOf(efmum({ customerType: CustomerTypeEnum.B2C }), [SEEDED[0], b2b])).toBe(1);
      expect(winnerOf(efmum({ placeOfSupplyStateCode: '27' }), [SEEDED[0], sameState])).toBe(27);
      expect(winnerOf(efmum({ placeOfSupplyStateCode: '29' }), [SEEDED[0], sameState])).toBe(1);
      expect(winnerOf(efmum({ supplierStateCode: '7', placeOfSupplyStateCode: '07' }), [sameState])).toBe(27);
    });

    it('a rule of another franchise, transaction type or supplier country never matches', () => {
      expect(winnerOf(efmum({ franchiseId: HCUAE }), [SEEDED[0]])).toBeNull();
      expect(winnerOf(efmum({ transactionType: TransactionType.PRODUCT }), [SEEDED[0]])).toBeNull();
      expect(winnerOf(efmum({ supplierCountryCode: 'AE' }), [SEEDED[0]])).toBeNull();
    });

    it('flags a full tie as ambiguous', () => {
      const twin = rule(28, { referenceId: 1 });
      expect(TaxRuleMatchUtil.resolve([SEEDED[0], twin], efmum({}))).toMatchObject({ ambiguous: true });
      expect(TaxRuleMatchUtil.resolve(SEEDED, efmum({}))).toMatchObject({ ambiguous: false });
    });
  });

  describe('duplicates (save, D4)', () => {
    it('the same conditions and the same effective_from are refused', () => {
      expect(TaxRuleMatchUtil.duplicates(rule(30, { referenceId: 1 }), SEEDED).map((r) => r.id)).toEqual([1]);
    });

    it('a later effective_from is not a duplicate (it supersedes from its date)', () => {
      expect(TaxRuleMatchUtil.duplicates(rule(31, { effectiveFrom: '2026-11-01' }), SEEDED)).toEqual([]);
    });

    it('an ALL rule ignores the reference; a SPECIFIC rule compares it', () => {
      expect(TaxRuleMatchUtil.duplicates(rule(32, { referenceId: 99 }), SEEDED).map((r) => r.id)).toEqual([1]);
      expect(TaxRuleMatchUtil.duplicates(rule(33, { ...mahi, referenceId: 2, appliesTo: RuleAppliesToEnum.SPECIFIC }), SEEDED)).toEqual([]);
      expect(TaxRuleMatchUtil.duplicates(rule(34, { ...mahi, referenceId: 1, appliesTo: RuleAppliesToEnum.SPECIFIC }), SEEDED).map((r) => r.id)).toEqual([3]);
    });

    it('a rule is not its own duplicate; inactive rules are never duplicates', () => {
      expect(TaxRuleMatchUtil.duplicates(SEEDED[0], SEEDED)).toEqual([]);
      expect(TaxRuleMatchUtil.duplicates({ ...SEEDED[0], id: null, active: false }, SEEDED)).toEqual([]);
      expect(TaxRuleMatchUtil.duplicates(rule(35, { ...mahi, referenceId: 1, appliesTo: RuleAppliesToEnum.SPECIFIC, effectiveFrom: '2025-09-22' }), SEEDED)).toEqual([]);
    });
  });

  describe('place of supply (decision 3)', () => {
    it('services: the billing address', () => {
      expect(
        TaxRuleMatchUtil.placeOfSupply({
          transactionType: TransactionType.SERVICE,
          supplierCountryCode: 'IN',
          billingCountryCode: 'us',
          billingStateCode: 'US-FL',
          deliveryCountryCode: 'IN',
          deliveryStateCode: '27',
        }),
      ).toEqual({ countryCode: 'US', stateCode: 'US-FL', source: 'BILLING', stateDiffersFromBilling: false });
    });

    it('goods: the delivery address, never the billing one', () => {
      expect(
        TaxRuleMatchUtil.placeOfSupply({
          transactionType: TransactionType.PRODUCT,
          supplierCountryCode: 'IN',
          billingCountryCode: 'IN',
          billingStateCode: '27',
          deliveryCountryCode: 'US',
          deliveryStateCode: null,
        }),
      ).toEqual({ countryCode: 'US', stateCode: null, source: 'DELIVERY', stateDiffersFromBilling: false });
    });

    it('India B2B services: the GSTIN State, with the difference from the billing State flagged', () => {
      expect(
        TaxRuleMatchUtil.placeOfSupply({
          transactionType: TransactionType.SERVICE,
          supplierCountryCode: 'IN',
          billingCountryCode: 'IN',
          billingStateCode: '29',
          customerRegistrationNumber: '27CSEPS5397E1Z8',
        }),
      ).toEqual({ countryCode: 'IN', stateCode: '27', source: 'GSTIN', stateDiffersFromBilling: true });
    });

    it('a Delhi GSTIN gives State 7, the State master\'s form, not 07 (plan 2b.3)', () => {
      const first14 = '07CSEPS5397E1Z';
      const delhi = first14 + TaxRegistrationNumberUtil.gstinCheckCharacter(first14);
      expect(
        TaxRuleMatchUtil.placeOfSupply({ transactionType: TransactionType.SERVICE, supplierCountryCode: 'IN', billingCountryCode: 'IN', billingStateCode: '7', customerRegistrationNumber: delhi }),
      ).toEqual({ countryCode: 'IN', stateCode: '7', source: 'GSTIN', stateDiffersFromBilling: false });
      expect(
        TaxRuleMatchUtil.placeOfSupply({ transactionType: TransactionType.SERVICE, supplierCountryCode: 'IN', billingCountryCode: 'IN', billingStateCode: '07' }).stateCode,
      ).toBe('7');
    });

    it('a GSTIN never turns a foreign billing address into India (plan 2b.4)', () => {
      expect(
        TaxRuleMatchUtil.placeOfSupply({ transactionType: TransactionType.SERVICE, supplierCountryCode: 'IN', billingCountryCode: 'US', billingStateCode: 'US-FL', customerRegistrationNumber: '27CSEPS5397E1Z8' }),
      ).toEqual({ countryCode: 'US', stateCode: 'US-FL', source: 'BILLING', stateDiffersFromBilling: false });
    });

    it('an invalid GSTIN, or a non-Indian supplier, keeps the billing address', () => {
      const base = { transactionType: TransactionType.SERVICE, billingCountryCode: 'IN', billingStateCode: '29' };
      expect(TaxRuleMatchUtil.placeOfSupply({ ...base, supplierCountryCode: 'IN', customerRegistrationNumber: '456789' }).source).toBe('BILLING');
      expect(TaxRuleMatchUtil.placeOfSupply({ ...base, supplierCountryCode: 'AE', customerRegistrationNumber: '27CSEPS5397E1Z8' }).source).toBe('BILLING');
    });
  });

  describe('D4 order, dimension by dimension (plan 2b.1)', () => {
    // A domestic B2B sale that satisfies every set condition below
    const sale = efmum({ placeOfSupplyStateCode: '27', registered: true, customerType: CustomerTypeEnum.B2B, electronic: true, money: MoneyOriginEnum.DOMESTIC, referenceId: 263 });
    const dimensions: Array<[string, Partial<Rule>]> = [
      ['2 State relation', { stateRelation: StateRelationEnum.SAME }],
      ['3 registration', { registrationCondition: RegistrationConditionEnum.REGISTERED }],
      ['4 customer type', { customerTypeCondition: CustomerTypeConditionEnum.B2B }],
      ['5 electronic', { electronicCondition: ElectronicConditionEnum.YES }],
      ['6 money', { moneyCondition: MoneyConditionEnum.DOMESTIC }],
      ['7 applies to', { appliesTo: RuleAppliesToEnum.SPECIFIC, referenceId: 263 }],
    ];
    const later = Object.assign({}, ...dimensions.map(([, set]) => set)) as Partial<Rule>;

    it.each(dimensions.map((dimension, index) => [dimension[0], index] as const))(
      'dimension %s beats every later dimension and a later date',
      (_label, index) => {
        const setHere = rule(40, { ...dimensions[index][1] });
        const setLater = rule(41, { ...Object.assign({}, ...dimensions.slice(index + 1).map(([, set]) => set)), effectiveFrom: '2026-01-01' });
        expect(TaxRuleMatchUtil.matches(setLater, sale)).toBe(true);
        expect(winnerOf(sale, [setLater, setHere])).toBe(40);
      },
    );

    it('dimension 1: same country beats scope ANY set on dimensions 2–7 with a later date', () => {
      const anyScope = rule(42, { ...later, customerScope: CustomerScopeEnum.ANY, effectiveFrom: '2026-01-01' });
      expect(winnerOf(sale, [anyScope, rule(43, {})])).toBe(43);
    });

    it('dimension 1: a specific country beats any foreign set on dimensions 4–7 with a later date', () => {
      const usSale = efmum({ placeOfSupplyCountryCode: 'US', placeOfSupplyStateCode: null, customerType: CustomerTypeEnum.B2B, electronic: true, money: MoneyOriginEnum.FOREIGN });
      const us = rule(44, { customerScope: CustomerScopeEnum.SPECIFIC_COUNTRY, placeOfSupplyCountryCode: 'US' });
      const anyForeignSet = rule(45, {
        ...foreign,
        customerTypeCondition: CustomerTypeConditionEnum.B2B,
        electronicCondition: ElectronicConditionEnum.YES,
        moneyCondition: MoneyConditionEnum.FOREIGN,
        appliesTo: RuleAppliesToEnum.SPECIFIC,
        referenceId: 263,
        effectiveFrom: '2026-01-01',
      });
      expect(winnerOf(usSale, [anyForeignSet, us])).toBe(44);
    });

    it('an older rule with a condition beats a newer generic one; the date decides only between equals', () => {
      const olderB2b = rule(46, { customerTypeCondition: CustomerTypeConditionEnum.B2B, effectiveFrom: '2015-12-31' });
      const newerGeneric = rule(47, { effectiveFrom: '2026-01-01' });
      expect(winnerOf(sale, [newerGeneric, olderB2b])).toBe(46);
      expect(winnerOf(sale, [rule(48, { effectiveFrom: '2015-12-31' }), newerGeneric])).toBe(47);
    });
  });

  describe('missing or odd facts fail closed (plan 2b.2, 2b.5, 2b.6)', () => {
    it('no place-of-supply country: no rule at all, not "foreign"', () => {
      expect(winnerOf(efmum({ placeOfSupplyCountryCode: '', placeOfSupplyStateCode: null }))).toBeNull();
      expect(winnerOf(efmum({ placeOfSupplyCountryCode: '', money: MoneyOriginEnum.FOREIGN }))).toBeNull();
      expect(winnerOf(efmum({ placeOfSupplyCountryCode: '' }), [rule(50, { customerScope: CustomerScopeEnum.ANY })])).toBeNull();
    });

    it('a supply date with a time is read as its day', () => {
      const ended = rule(51, { effectiveTo: '2026-03-31' });
      expect(winnerOf(efmum({ supplyDate: '2026-03-31T10:00:00+05:30' }), [ended])).toBe(51);
    });

    it('an unknown payment route is no money fact: the money-conditioned rules do not match', () => {
      expect(TaxRuleMatchUtil.moneyOrigin('domestic')).toBeNull();
      expect(TaxRuleMatchUtil.moneyOrigin('LEGACY_ROUTE')).toBeNull();
      expect(winnerOf(efmum({ placeOfSupplyCountryCode: 'US', placeOfSupplyStateCode: null, money: TaxRuleMatchUtil.moneyOrigin('wire') }))).toBeNull();
    });
  });

  it('two rules differing only in their specific country are not duplicates', () => {
    const us = rule(52, { ...foreign, customerScope: CustomerScopeEnum.SPECIFIC_COUNTRY, placeOfSupplyCountryCode: 'US' });
    const ca = rule(53, { ...foreign, customerScope: CustomerScopeEnum.SPECIFIC_COUNTRY, placeOfSupplyCountryCode: 'CA' });
    expect(TaxRuleMatchUtil.duplicates(ca, [us])).toEqual([]);
    expect(TaxRuleMatchUtil.duplicates({ ...ca, id: 54, placeOfSupplyCountryCode: 'us' }, [us]).map((r) => r.id)).toEqual([52]);
  });

  it('money: the DOMESTIC route is domestic money, every other route foreign, none for goods', () => {
    expect(TaxRuleMatchUtil.moneyOrigin(PaymentRouteEnum.DOMESTIC)).toBe(MoneyOriginEnum.DOMESTIC);
    expect(TaxRuleMatchUtil.moneyOrigin(PaymentRouteEnum.RUPEE_VOSTRO)).toBe(MoneyOriginEnum.FOREIGN);
    expect(TaxRuleMatchUtil.moneyOrigin(PaymentRouteEnum.INTERNATIONAL_CARD_GATEWAY)).toBe(MoneyOriginEnum.FOREIGN);
    expect(TaxRuleMatchUtil.moneyOrigin(null)).toBeNull();
  });
});
