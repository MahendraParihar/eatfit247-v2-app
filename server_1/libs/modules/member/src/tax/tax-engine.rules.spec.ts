import { TaxEngineService, TaxInput } from '@server_1/modules/tax-engine';
import {
  CustomerTypeEnum,
  IAuthUser,
  ITaxRule,
  ITaxRulePreviewResponse,
  PaymentRouteEnum,
  TaxCategoryEnum,
  TaxEvidenceIndicatorResultEnum,
  TaxEvidenceStatusEnum,
  TaxMode,
  TaxTypeEnum,
  TransactionType,
} from '@eatfit247-shared-lib';
import { EFMUM, EngineHarness, HCUAE, MEMUM, SeedRule, engineHarness, rule, ruleById } from './seeded-tax-rules.fixture';

/**
 * Configurable tax treatment group 6: the engine prices a sale by the Tax Master rule that matches it
 * (decisions 3, 4, 6, 13; validation A5, A6, A9–A12b, A22 tax, A25).
 */
describe('TaxEngineService on Tax Master treatment rules', () => {
  let harness: EngineHarness;
  let rules: SeedRule[];
  let engine: TaxEngineService;

  beforeEach(() => {
    harness = engineHarness({ lut: (franchiseId) => (franchiseId === EFMUM ? { arn: 'AD270326000001T' } : null) });
    rules = harness.rules;
    engine = harness.engine;
  });

  const svc = (o: Partial<TaxInput>): TaxInput => ({
    baseAmount: 1000,
    discountAmount: 0,
    franchiseId: EFMUM,
    referenceId: 263,
    supplierCountryCode: 'IN',
    supplierStateCode: '27',
    customerCountryCode: 'IN',
    customerStateCode: '27',
    currency: 'INR',
    transactionType: TransactionType.SERVICE,
    supplyDate: '2026-10-12',
    ...o,
  });
  const uae = (o: Partial<TaxInput>): TaxInput =>
    svc({ franchiseId: HCUAE, supplierCountryCode: 'AE', supplierStateCode: '1', customerCountryCode: 'AE', customerStateCode: '1', currency: 'AED', ...o });
  const goods = (o: Partial<TaxInput>): TaxInput =>
    svc({ franchiseId: MEMUM, referenceId: 1, transactionType: TransactionType.PRODUCT, deliveryCountryCode: 'IN', deliveryStateCode: '27', ...o });
  const winner = async (): Promise<SeedRule> => harness.resolveOrThrow.mock.results[harness.resolveOrThrow.mock.results.length - 1].value;

  describe('A5: HCUAE changes its export rule to CHARGE 5% STANDARD (configuration only)', () => {
    it('a US client is charged VAT 5% S by the changed rule', async () => {
      const before = await engine.calculate(uae({ customerCountryCode: 'US', currency: 'USD' }));
      expect(before).toMatchObject({ taxAmount: 0, taxCategory: TaxCategoryEnum.ZERO_RATED, taxMasterId: 10 });
      Object.assign(ruleById(rules, 10), {
        treatment: 'CHARGE',
        taxPercent: 5,
        taxCategory: 'STANDARD',
        invoiceNote: null,
        requiresEvidence: false,
        fallbackTaxMasterId: null,
      });
      const after = await engine.calculate(uae({ customerCountryCode: 'US', currency: 'USD' }));
      expect(after).toMatchObject({
        taxType: TaxTypeEnum.VAT,
        taxMode: TaxMode.VAT,
        taxPercentage: 5,
        taxAmount: 50,
        totalAmount: 1050,
        taxCategory: TaxCategoryEnum.STANDARD,
        taxMasterId: 10,
        placeOfSupplyCountryCode: 'US',
      });
    });
  });

  describe('A6: precedence in the engine (D4)', () => {
    const SA_CHARGE = (): SeedRule =>
      rule({ id: 201, franchiseId: HCUAE, countryCode: 'AE', transactionType: 'SERVICE', customerScope: 'SPECIFIC_COUNTRY', placeOfSupplyCountryCode: 'SA', taxSystem: TaxTypeEnum.VAT, taxPercent: 5, taxCategory: 'STANDARD', effectiveFrom: '2025-12-31' });

    it('"customer SA → CHARGE 5%" beats "any foreign → zero-rated" for an SA client, not for a US client', async () => {
      rules.push(SA_CHARGE());
      expect(await engine.calculate(uae({ customerCountryCode: 'SA', currency: 'USD' }))).toMatchObject({ taxAmount: 50, taxMasterId: 201 });
      expect(await engine.calculate(uae({ customerCountryCode: 'US', currency: 'USD' }))).toMatchObject({ taxAmount: 0, taxMasterId: 10 });
    });

    it('"any foreign, electronic YES" does not beat "customer SA"', async () => {
      rules.push(SA_CHARGE());
      rules.push(rule({ id: 202, franchiseId: HCUAE, countryCode: 'AE', transactionType: 'SERVICE', customerScope: 'ANY_FOREIGN', electronicCondition: 'YES', taxSystem: TaxTypeEnum.VAT, taxPercent: 0, taxCategory: 'ZERO_RATED', treatment: 'ZERO_RATED_EXPORT', effectiveFrom: '2025-12-31' }));
      harness.electronicPlans.add(263);
      expect(await engine.calculate(uae({ customerCountryCode: 'SA', currency: 'USD' }))).toMatchObject({ taxMasterId: 201 });
      expect(await engine.calculate(uae({ customerCountryCode: 'US', currency: 'USD' }))).toMatchObject({ taxMasterId: 202 });
    });

    it('MEMUM\'s "other State, unregistered → REFUSE" beats the product-specific CHARGE row', async () => {
      await expect(engine.calculate(goods({ deliveryStateCode: '29' }))).rejects.toThrow('CGST s.24(i)');
      expect((await winner()).id).toBe(7);
    });

    it('a plan-specific rule beats an all-plans rule only when their conditions are equal', async () => {
      // Plan 263 at 5% for ANY customer: loses at home to rule 1 (same country is the more specific scope) and
      // abroad to rule 5 (money FOREIGN), so it never prices a sale
      rules.push(rule({ id: 203, franchiseId: EFMUM, countryCode: 'IN', transactionType: 'SERVICE', referenceId: 263, appliesTo: 'SPECIFIC', customerScope: 'ANY', taxSystem: TaxTypeEnum.GST, taxPercent: 5 }));
      expect(await engine.calculate(svc({}))).toMatchObject({ taxPercentage: 18, taxMasterId: 1 });
      expect(await engine.calculate(svc({ customerCountryCode: 'US', customerStateCode: null, currency: 'USD' }))).toMatchObject({ taxMasterId: 5 });
      // The same plan rule with rule 1's conditions (same country) wins for that plan only
      rules.push(rule({ id: 204, franchiseId: EFMUM, countryCode: 'IN', transactionType: 'SERVICE', referenceId: 263, appliesTo: 'SPECIFIC', taxSystem: TaxTypeEnum.GST, taxPercent: 5 }));
      expect(await engine.calculate(svc({}))).toMatchObject({ taxPercentage: 5, taxMasterId: 204 });
      expect(await engine.calculate(svc({ referenceId: 264 }))).toMatchObject({ taxPercentage: 18, taxMasterId: 1 });
    });
  });

  describe('A9: MEMUM unregistered, goods (no mst_configs read)', () => {
    it('the engine takes no configuration service: the harness gives it none, so the s.24(i) decision can only be the rule', () => {
      // TaxEngineService(indiaGst, vat, usSalesTax, countries, taxMaster, lut, franchises, registrations): no AppConfigService
      expect(TaxEngineService.length).toBe(8);
    });

    it('another State or an unknown State → refused; the same State → priced without GST', async () => {
      await expect(engine.calculate(goods({ deliveryStateCode: '29' }))).rejects.toThrow('CGST s.24(i)');
      await expect(engine.calculate(goods({ supplierStateCode: null }))).rejects.toThrow('CGST s.24(i)');
      const same = await engine.calculate(goods({ baseAmount: 1120 }));
      expect(same).toMatchObject({ taxMode: TaxMode.NO_TAX, taxAmount: 0, totalAmount: 1120, taxMasterId: 3, taxRegistrationId: null });
    });

    it('the owner changes the refusal to CHARGE → the inter-state sale is priced without GST', async () => {
      Object.assign(ruleById(rules, 7), { treatment: 'CHARGE', refusalMessage: null });
      expect(await engine.calculate(goods({ deliveryStateCode: '29' }))).toMatchObject({ taxMode: TaxMode.NO_TAX, taxAmount: 0, taxMasterId: 7 });
    });
  });

  describe('A10: the Indian-client refusal is a code invariant', () => {
    it('under HCUAE, or under a new non-Indian franchise with no rules, refused before any rule lookup', async () => {
      await expect(engine.calculate(uae({ customerCountryCode: 'IN', customerStateCode: '27' }))).rejects.toThrow('Indian clients must be registered under the India franchise.');
      await expect(
        engine.calculate(svc({ franchiseId: 99, supplierCountryCode: 'SA', supplierStateCode: null, customerCountryCode: 'IN' })),
      ).rejects.toThrow('Indian clients must be registered under the India franchise.');
      expect(harness.resolveOrThrow).not.toHaveBeenCalled();
    });

    it('no rule overrides it: an "Indian client" CHARGE rule on HCUAE is never reached', async () => {
      rules.push(rule({ id: 204, franchiseId: HCUAE, countryCode: 'AE', transactionType: 'SERVICE', customerScope: 'SPECIFIC_COUNTRY', placeOfSupplyCountryCode: 'IN', taxSystem: TaxTypeEnum.VAT, taxPercent: 5, taxCategory: 'STANDARD' }));
      await expect(engine.calculate(uae({ customerCountryCode: 'IN', customerStateCode: '27' }))).rejects.toThrow('Indian clients');
    });
  });

  describe('A11: a default goods rule (applies to ALL)', () => {
    beforeEach(() => {
      harness.registrations[MEMUM] = [{ taxRegistrationId: 3, taxSystem: TaxTypeEnum.GST, countryCode: 'IN' }];
      rules.push(rule({ id: 205, franchiseId: MEMUM, countryCode: 'IN', transactionType: 'PRODUCT', taxSystem: TaxTypeEnum.GST, taxPercent: 18, hsnSacCode: '2106' }));
    });

    it('prices a new product that has no rule of its own', async () => {
      expect(await engine.calculate(goods({ referenceId: 99 }))).toMatchObject({ taxPercentage: 18, taxAmount: 180, hsnSacCode: '2106', taxMasterId: 205 });
    });

    it('a product-specific rule with equal conditions still wins', async () => {
      expect(await engine.calculate(goods({ baseAmount: 1120 }))).toMatchObject({ taxPercentage: 12, hsnSacCode: '3004', taxMasterId: 3 });
    });

    it('without a default rule, a product with no rule is "no tax rule" (never a silent no tax)', async () => {
      ruleById(rules, 205).active = false;
      await expect(engine.calculate(goods({ referenceId: 99 }))).rejects.toThrow('No active tax rule for franchise 3, country IN, PRODUCT (reference 99)');
    });
  });

  describe('A12b: FOREIGN_REGISTRATION is refused until group 11', () => {
    it('a matching rule refuses the sale with a clear message', async () => {
      rules.push(rule({ id: 206, franchiseId: EFMUM, countryCode: 'IN', transactionType: 'SERVICE', customerScope: 'SPECIFIC_COUNTRY', placeOfSupplyCountryCode: 'AE', electronicCondition: 'YES', treatment: 'FOREIGN_REGISTRATION', taxSystem: TaxTypeEnum.VAT, taxPercent: 5, taxCategory: 'STANDARD' }));
      harness.electronicPlans.add(263);
      await expect(engine.calculate(svc({ customerCountryCode: 'AE', customerStateCode: null, currency: 'AED' }))).rejects.toThrow(
        "invoices this sale under the franchise's registration in United Arab Emirates, which the system can't issue yet",
      );
      // A plan that is not electronic still exports
      harness.electronicPlans.clear();
      expect(await engine.calculate(svc({ customerCountryCode: 'AE', customerStateCode: null, currency: 'AED' }))).toMatchObject({ taxMode: TaxMode.EXPORT_OF_SERVICE });
    });
  });

  describe('A25 / decision 13: the stored decision', () => {
    it('returns the rule and the registration that priced the sale', async () => {
      expect(await engine.calculate(svc({}))).toMatchObject({ taxMasterId: 1, taxRegistrationId: 1, requiresEvidence: false });
      expect(await engine.calculate(uae({ customerCountryCode: 'US', currency: 'USD' }))).toMatchObject({ taxMasterId: 10, taxRegistrationId: 2, requiresEvidence: true });
    });

    it('customer type not assessed (NULL) until the customer GSTIN / TRN feeds the facts (group 9)', async () => {
      expect((await engine.calculate(svc({}))).customerType).toBeNull();
      expect(harness.resolveOrThrow.mock.calls[0][0]).toMatchObject({ customerType: CustomerTypeEnum.B2C });
    });

    it('registration null when unregistered', async () => {
      expect(await engine.calculate(goods({}))).toMatchObject({ taxMasterId: 3, taxRegistrationId: null });
    });
  });

  describe('executors (decision 6 invariants)', () => {
    it('a GST CHARGE without an active GST registration prices as no tax, at home and abroad', async () => {
      harness.registrations[EFMUM] = [];
      expect(await engine.calculate(svc({}))).toMatchObject({ taxMode: TaxMode.NO_TAX, taxAmount: 0, taxRegistrationId: null });
      // Abroad with INR over Indian rails: rule 6 (CHARGE IGST); unregistered → no GST (it is not an export)
      expect(await engine.calculate(svc({ customerCountryCode: 'US', customerStateCode: null }))).toMatchObject({ taxMode: TaxMode.NO_TAX, taxMasterId: 6 });
    });

    it('an export treatment without a GST registration is refused', async () => {
      harness.registrations[EFMUM] = [];
      await expect(engine.calculate(svc({ customerCountryCode: 'US', currency: 'USD' }))).rejects.toThrow('not GST-registered');
    });

    it('a GST CHARGE abroad with foreign money is IGST with no State (IGST s.7(5)(a))', async () => {
      rules.push(rule({ id: 207, franchiseId: EFMUM, countryCode: 'IN', transactionType: 'SERVICE', customerScope: 'SPECIFIC_COUNTRY', placeOfSupplyCountryCode: 'US', moneyCondition: 'FOREIGN', taxSystem: TaxTypeEnum.GST, taxPercent: 18 }));
      const r = await engine.calculate(svc({ customerCountryCode: 'US', customerStateCode: 'NY', currency: 'USD' }));
      expect(r).toMatchObject({ taxMode: TaxMode.DOMESTIC_GST, taxAmount: 180, placeOfSupplyStateCode: null, taxMasterId: 207, paymentRoute: PaymentRouteEnum.INTERNATIONAL_CARD_GATEWAY });
      expect(r.taxObj).toEqual({ IGST: { amount: 180, taxPercentage: 18 } });
    });

    it('OUT_OF_SCOPE on VAT → VAT 0%, category O, with the rule\'s note', async () => {
      Object.assign(ruleById(rules, 10), { treatment: 'OUT_OF_SCOPE', taxCategory: 'OUT_OF_SCOPE', invoiceNote: 'Outside the scope of UAE VAT.', requiresEvidence: false, fallbackTaxMasterId: null });
      expect(await engine.calculate(uae({ customerCountryCode: 'US', currency: 'USD' }))).toMatchObject({
        taxMode: TaxMode.VAT,
        taxAmount: 0,
        taxCategory: TaxCategoryEnum.OUT_OF_SCOPE,
        invoiceNote: 'Outside the scope of UAE VAT.',
      });
    });

    it('REFUSE uses the rule\'s message', async () => {
      Object.assign(ruleById(rules, 10), { treatment: 'REFUSE', refusalMessage: 'Not sold outside the UAE.', requiresEvidence: false, fallbackTaxMasterId: null });
      await expect(engine.calculate(uae({ customerCountryCode: 'US', currency: 'USD' }))).rejects.toThrow('Not sold outside the UAE.');
    });

    it('an inclusive price backs tax out at the matched rule\'s rate', async () => {
      harness.registrations[MEMUM] = [{ taxRegistrationId: 3, taxSystem: TaxTypeEnum.GST, countryCode: 'IN' }];
      const r = await engine.calculate(goods({ baseAmount: 1120 }));
      expect(r.baseAmount).toBeCloseTo(1000, 2);
      expect(r.taxAmount).toBeCloseTo(120, 2);
    });

    it('domestic money is the franchise\'s own currency: AED for HCUAE (no INR literal)', async () => {
      await engine.calculate(uae({ customerCountryCode: 'US', currency: 'AED', paymentRoute: PaymentRouteEnum.DOMESTIC }));
      expect(harness.resolveOrThrow.mock.calls[0][0]).toMatchObject({ money: 'DOMESTIC' });
      await engine.calculate(uae({ customerCountryCode: 'US', currency: 'USD', paymentRoute: PaymentRouteEnum.DOMESTIC }));
      expect(harness.resolveOrThrow.mock.calls[1][0]).toMatchObject({ money: 'FOREIGN' });
    });
  });

  describe('6b.1: a GST sale abroad is priced at the supply\'s own rate (D3)', () => {
    it('MEMUM registered with its staged 5% active: exports match row 8 (12% incl.) but charge row 4\'s 5%, exclusive', async () => {
      harness.registrations[MEMUM] = [{ taxRegistrationId: 3, taxSystem: TaxTypeEnum.GST, countryCode: 'IN' }];
      ruleById(rules, 4).active = true;
      const r = await engine.calculate(goods({ baseAmount: 1005, customerCountryCode: 'AE', deliveryCountryCode: 'AE', deliveryStateCode: '1' }));
      expect(r).toMatchObject({ taxMode: TaxMode.EXPORT_OF_GOODS, taxPercentage: 5, taxAmount: 50.25, totalAmount: 1055.25, hsnSacCode: '3004', taxMasterId: 8 });
    });

    it('a plan rate added later reaches the plan\'s sales abroad: export with IGST and IGST abroad at the plan\'s 5%', async () => {
      harness.findValid.mockResolvedValue(null);
      rules.push(rule({ id: 210, franchiseId: EFMUM, countryCode: 'IN', transactionType: 'SERVICE', referenceId: 263, appliesTo: 'SPECIFIC', taxSystem: TaxTypeEnum.GST, taxPercent: 5, hsnSacCode: '999723' }));
      const exported = await engine.calculate(svc({ customerCountryCode: 'US', customerStateCode: null, currency: 'USD' }));
      expect(exported).toMatchObject({ taxMode: TaxMode.EXPORT_OF_SERVICE, taxPercentage: 5, taxAmount: 50, hsnSacCode: '999723', taxMasterId: 5 });
      expect(exported.taxDecisionReason).toContain('IGST 5% charged');
      const abroadInr = await engine.calculate(svc({ customerCountryCode: 'US', customerStateCode: null }));
      expect(abroadInr).toMatchObject({ taxMode: TaxMode.DOMESTIC_GST, taxAmount: 50, taxMasterId: 6 });
      // Other plans keep rule 1's 18%
      expect(await engine.calculate(svc({ referenceId: 264, customerCountryCode: 'US', customerStateCode: null }))).toMatchObject({ taxAmount: 180 });
    });

    it('no same-country rate rule for the supply → today\'s "No active tax rule" 400', async () => {
      ruleById(rules, 1).active = false;
      await expect(engine.calculate(svc({ customerCountryCode: 'US', customerStateCode: null, currency: 'USD' }))).rejects.toThrow(
        'No active tax rule for franchise 1, country IN, SERVICE (reference 263)',
      );
    });

    it('VAT rules keep their own rate (A5): the supply rate applies to GST only', async () => {
      Object.assign(ruleById(rules, 10), { treatment: 'CHARGE', taxPercent: 5, taxCategory: 'STANDARD', invoiceNote: null, requiresEvidence: false, fallbackTaxMasterId: null });
      expect(await engine.calculate(uae({ customerCountryCode: 'US', currency: 'USD' }))).toMatchObject({ taxPercentage: 5, taxMasterId: 10 });
    });
  });

  describe('6b.4 / 6b.5: fail closed', () => {
    it('a franchise without a working currency → 400 (the money route can\'t be decided)', async () => {
      harness.franchises[EFMUM].currencyCode = null;
      await expect(engine.calculate(svc({}))).rejects.toThrow('no working currency');
      expect(harness.resolveOrThrow).not.toHaveBeenCalled();
    });

    it('OUT_OF_SCOPE on GST without a GST registration is refused, like an export', async () => {
      rules.push(rule({ id: 211, franchiseId: EFMUM, countryCode: 'IN', transactionType: 'SERVICE', customerScope: 'SPECIFIC_COUNTRY', placeOfSupplyCountryCode: 'US', treatment: 'OUT_OF_SCOPE', taxSystem: TaxTypeEnum.GST }));
      harness.registrations[EFMUM] = [];
      await expect(engine.calculate(svc({ customerCountryCode: 'US', customerStateCode: null, currency: 'USD' }))).rejects.toThrow('not GST-registered');
      harness.registrations[EFMUM] = [{ taxRegistrationId: 1, taxSystem: TaxTypeEnum.GST, countryCode: 'IN' }];
      expect(await engine.calculate(svc({ customerCountryCode: 'US', customerStateCode: null, currency: 'USD' }))).toMatchObject({ taxMode: TaxMode.NO_TAX, taxMasterId: 211 });
    });
  });

  describe('A22 (tax): the preview prices the amount', () => {
    const user = { adminUserId: 19, franchiseIds: [], allFranchises: true } as unknown as IAuthUser;
    const previewOf = (winnerRule: SeedRule | null): ITaxRulePreviewResponse => ({
      facts: {
        franchiseId: HCUAE,
        supplierCountryCode: 'AE',
        supplierStateCode: '1',
        transactionType: TransactionType.SERVICE,
        referenceId: 263,
        placeOfSupplyCountryCode: 'US',
        registered: true,
        customerType: CustomerTypeEnum.B2C,
        electronic: false,
        money: 'FOREIGN',
        supplyDate: '2026-10-12',
      },
      winner: winnerRule as unknown as ITaxRule,
      runnersUp: [],
      warnings: [],
      tax: null,
    });

    it('returns the computed tax for the amount, in the franchise currency when none is given', async () => {
      jest.spyOn(harness.taxMaster, 'preview').mockResolvedValue(previewOf(ruleById(rules, 10)));
      const response = await engine.preview(
        { franchiseId: HCUAE, transactionType: TransactionType.SERVICE, referenceId: 263, billingCountryCode: 'US', amount: 1000 },
        user,
      );
      expect(response.tax).toMatchObject({ taxAmount: 0, totalAmount: 1000, currency: 'AED', taxCategory: TaxCategoryEnum.ZERO_RATED, taxMasterId: 10, requiresEvidence: true });
    });

    it('no amount → no tax; a refusal → a NOT_PRICED warning, nothing thrown', async () => {
      jest.spyOn(harness.taxMaster, 'preview').mockResolvedValue(previewOf(ruleById(rules, 10)));
      expect((await engine.preview({ franchiseId: HCUAE, transactionType: TransactionType.SERVICE, referenceId: 263, billingCountryCode: 'US' }, user)).tax).toBeNull();
      Object.assign(ruleById(rules, 10), { treatment: 'REFUSE', refusalMessage: 'Not sold outside the UAE.' });
      const refused = await engine.preview(
        { franchiseId: HCUAE, transactionType: TransactionType.SERVICE, referenceId: 263, billingCountryCode: 'US', amount: 1000 },
        user,
      );
      expect(refused.tax).toBeNull();
      expect(refused.warnings).toContainEqual({ code: 'NOT_PRICED', message: 'Not sold outside the UAE.' });
    });

    it('6b.2: a winner the pricing doesn\'t reach (e.g. a customer GSTIN) → FACTS_DIFFER', async () => {
      jest.spyOn(harness.taxMaster, 'preview').mockResolvedValue(previewOf(ruleById(rules, 9)));
      const response = await engine.preview(
        { franchiseId: HCUAE, transactionType: TransactionType.SERVICE, referenceId: 263, billingCountryCode: 'US', amount: 1000 },
        user,
      );
      expect(response.tax).toMatchObject({ taxMasterId: 10 });
      expect(response.warnings.map((w) => w.code)).toContain('FACTS_DIFFER');
    });
  });

  describe('public checkout evidence (decision 9)', () => {
    it('NOT_COLLECTED when the rule requires evidence; none otherwise', () => {
      expect(TaxEngineService.notCollectedEvidence({ requiresEvidence: true, taxMasterId: 10 })).toMatchObject({
        status: TaxEvidenceStatusEnum.NOT_COLLECTED,
        taxMasterId: 10,
        indicators: { billingCountry: { result: TaxEvidenceIndicatorResultEnum.NOT_AVAILABLE } },
        decision: null,
      });
      expect(TaxEngineService.notCollectedEvidence({ requiresEvidence: false, taxMasterId: 1 })).toBeNull();
    });
  });
});
