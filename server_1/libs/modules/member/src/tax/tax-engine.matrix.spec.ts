import { InvoiceSeriesUtil } from '@server_1/platform';
import {
  EXPORT_UNDER_LUT_NOTE,
  EXPORT_WITH_IGST_NOTE,
  TaxEngineService,
  TaxInput,
  UAE_ZERO_RATED_EXPORT_NOTE,
  UAE_ZERO_RATED_GOODS_EXPORT_NOTE,
} from '@server_1/modules/tax-engine';
import {
  InvoiceSeriesEnum,
  PaymentRouteEnum,
  TaxCategoryEnum,
  TaxMode,
  TaxTypeEnum,
  TransactionType,
} from '@eatfit247-shared-lib';
import { EFMUM, EngineHarness, HCUAE, MEMUM, SeedRule, engineHarness, rule, ruleById } from './seeded-tax-rules.fixture';

/**
 * Spec 2026-10-10-tax-mapping-matrix, group 3: one case per row of the legal mapping table
 * (requirements.md § "The mapping table") and its variants. Since configurable tax treatment group 6 the
 * engine resolves the migration-146 rules (rows 1–11 of the local DB, `seeded-tax-rules.fixture.ts`) through
 * the real resolver; the expected tax outputs are unchanged (A4). Row numbers in the names match the table.
 */
describe('Tax mapping matrix (franchise × customer × goods/services)', () => {
  const LUT = 'AD270326000001T';

  let lutValidity: { from: string; to: string } | null;
  let harness: EngineHarness;
  let engine: TaxEngineService;
  let rules: SeedRule[];

  beforeEach(() => {
    lutValidity = { from: '2026-04-01', to: '2027-03-31' };
    harness = engineHarness({
      lut: (franchiseId, date) => (franchiseId === EFMUM && lutValidity && date >= lutValidity.from && date <= lutValidity.to ? { arn: LUT } : null),
    });
    engine = harness.engine;
    rules = harness.rules;
  });

  /** HCUAE's rate switched to 5% STANDARD (configuration, the Art 41 adviser item) */
  const hcuaeStandardRate = (): void => {
    Object.assign(ruleById(rules, 2), { taxPercent: 5, taxCategory: TaxCategoryEnum.STANDARD });
  };
  /** A HCUAE goods rule for product 7 in the UAE, VAT 5% STANDARD (configuration) */
  const hcuaeProductRule = (): void => {
    rules.push(rule({ id: 107, franchiseId: HCUAE, countryCode: 'AE', transactionType: 'PRODUCT', referenceId: 7, appliesTo: 'SPECIFIC', taxSystem: TaxTypeEnum.VAT, taxPercent: 5, taxCategory: 'STANDARD', effectiveFrom: '2025-12-31' }));
  };
  /**
   * Mahi registered: its GSTIN and the staged 5% rule (row 4) activated, nothing else. Its exports still match the
   * seeded row 8 and are priced at the supply's own rate, now row 4's 5% (requirements D3, group 6b).
   */
  const memumRegisteredAt5 = (): void => {
    harness.registrations[MEMUM] = [{ taxRegistrationId: 3, taxSystem: TaxTypeEnum.GST, countryCode: 'IN' }];
    ruleById(rules, 4).active = true;
  };

  const svc = (o: Partial<TaxInput>): TaxInput => ({
    baseAmount: 1005,
    discountAmount: 0,
    franchiseId: EFMUM,
    referenceId: 1,
    supplierCountryCode: 'IN',
    supplierStateCode: '27',
    customerCountryCode: 'IN',
    customerStateCode: '27',
    currency: 'INR',
    transactionType: TransactionType.SERVICE,
    supplyDate: '2026-10-12',
    ...o,
  });
  const goods = (o: Partial<TaxInput>): TaxInput =>
    svc({ franchiseId: MEMUM, transactionType: TransactionType.PRODUCT, deliveryCountryCode: 'IN', deliveryStateCode: '27', ...o });
  const uae = (o: Partial<TaxInput>): TaxInput =>
    svc({ franchiseId: HCUAE, supplierCountryCode: 'AE', supplierStateCode: '1', customerCountryCode: 'AE', customerStateCode: '1', currency: 'AED', ...o });
  const series = (taxMode: TaxMode | undefined, franchiseCountry: string, billingCountry: string, taxAmount: number): InvoiceSeriesEnum =>
    InvoiceSeriesUtil.resolve({ taxModes: [taxMode as TaxMode], franchiseCountryCode: franchiseCountry, billingCountryCode: billingCountry, taxAmount });

  describe('India franchise, services (EFMUM)', () => {
    it('row 1: Indian client in the franchise State → CGST 9 + SGST 9, State 27 stored, SAC 999319, domestic series', async () => {
      const r = await engine.calculate(svc({}));
      expect(r).toMatchObject({
        taxMode: TaxMode.DOMESTIC_GST,
        taxPercentage: 18,
        taxAmount: 180.9,
        totalAmount: 1185.9,
        placeOfSupplyCountryCode: 'IN',
        placeOfSupplyStateCode: '27',
        hsnSacCode: '999319',
        taxCategory: null,
      });
      expect(r.taxObj).toEqual({ CGST: { amount: 90.45, taxPercentage: 9 }, SGST: { amount: 90.45, taxPercentage: 9 } });
      expect(series(r.taxMode, 'IN', 'IN', r.taxAmount)).toBe(InvoiceSeriesEnum.DOMESTIC);
    });

    it('row 2: Indian client in another State → IGST 18, State 29 stored', async () => {
      const r = await engine.calculate(svc({ customerStateCode: '29' }));
      expect(r.taxObj).toEqual({ IGST: { amount: 180.9, taxPercentage: 18 } });
      expect(r).toMatchObject({ placeOfSupplyCountryCode: 'IN', placeOfSupplyStateCode: '29' });
    });

    it('A15: a plan-specific rule wins; without one the default service rule (reference 1) applies', async () => {
      rules.push(rule({ id: 142, franchiseId: EFMUM, countryCode: 'IN', transactionType: 'SERVICE', referenceId: 42, appliesTo: 'SPECIFIC', taxSystem: TaxTypeEnum.GST, taxPercent: 5, hsnSacCode: '999723' }));
      const own = await engine.calculate(svc({ referenceId: 42 }));
      expect(own).toMatchObject({ taxPercentage: 5, hsnSacCode: '999723' });
      const fallback = await engine.calculate(svc({ referenceId: 43 }));
      expect(fallback).toMatchObject({ taxPercentage: 18, hsnSacCode: '999319' });
    });

    it('row 5: foreign client, foreign currency, LUT valid → export of service 0% under LUT, export series, no State', async () => {
      const r = await engine.calculate(svc({ customerCountryCode: 'US', customerStateCode: '1', currency: 'USD' }));
      expect(r).toMatchObject({
        taxMode: TaxMode.EXPORT_OF_SERVICE,
        taxAmount: 0,
        isLutApplied: true,
        lutArn: LUT,
        invoiceNote: EXPORT_UNDER_LUT_NOTE,
        paymentRoute: PaymentRouteEnum.INTERNATIONAL_CARD_GATEWAY,
        placeOfSupplyCountryCode: 'US',
        placeOfSupplyStateCode: null,
      });
      expect(series(r.taxMode, 'IN', 'US', r.taxAmount)).toBe(InvoiceSeriesEnum.EXPORT);
    });

    it.each([PaymentRouteEnum.FOREIGN_REMITTANCE, PaymentRouteEnum.RUPEE_VOSTRO, PaymentRouteEnum.NRE_FCNR_ACCOUNT])(
      'row 5: INR received via %s is export proceeds → 0% under LUT',
      async (paymentRoute) => {
        const r = await engine.calculate(svc({ customerCountryCode: 'US', customerStateCode: '1', currency: 'INR', paymentRoute }));
        expect(r).toMatchObject({ taxMode: TaxMode.EXPORT_OF_SERVICE, taxAmount: 0, isLutApplied: true, paymentRoute });
      },
    );

    it('row 5b: foreign client, foreign currency, LUT expired → export with IGST 18 paid, export series', async () => {
      const r = await engine.calculate(svc({ customerCountryCode: 'US', customerStateCode: '1', currency: 'USD', supplyDate: '2027-04-02' }));
      expect(r).toMatchObject({ taxMode: TaxMode.EXPORT_OF_SERVICE, taxAmount: 180.9, isLutApplied: false, lutArn: null, invoiceNote: EXPORT_WITH_IGST_NOTE });
      expect(r.taxDecisionReason).toContain('no valid LUT on 2027-04-02');
      expect(series(r.taxMode, 'IN', 'US', r.taxAmount)).toBe(InvoiceSeriesEnum.EXPORT);
    });

    it('row 6: foreign client paying INR over Indian rails → IGST 18, not an export, domestic series', async () => {
      for (const paymentRoute of [undefined, PaymentRouteEnum.DOMESTIC]) {
        const r = await engine.calculate(svc({ customerCountryCode: 'US', customerStateCode: '1', currency: 'INR', paymentRoute }));
        expect(r).toMatchObject({ taxMode: TaxMode.DOMESTIC_GST, taxAmount: 180.9, isLutApplied: false, placeOfSupplyCountryCode: 'US', placeOfSupplyStateCode: null });
        expect(r.taxObj).toEqual({ IGST: { amount: 180.9, taxPercentage: 18 } });
        expect(series(r.taxMode, 'IN', 'US', r.taxAmount)).toBe(InvoiceSeriesEnum.DOMESTIC);
      }
    });

    it('row 14: the electronic-service flag changes nothing on the seeded rules (adviser decision pending; they match any)', async () => {
      harness.electronicPlans.add(1);
      const r = await engine.calculate(svc({ customerCountryCode: 'AE', customerStateCode: '1', currency: 'USD' }));
      expect(r).toMatchObject({ taxMode: TaxMode.EXPORT_OF_SERVICE, taxAmount: 0 });
    });
  });

  describe('India franchise, goods (MEMUM)', () => {
    it('rows 3/4 with the staged GST 5% rule active: same State → CGST 2.5 + SGST 2.5; other State → IGST 5; HSN 3004', async () => {
      memumRegisteredAt5();
      const same = await engine.calculate(goods({}));
      expect(same.taxObj).toEqual({ CGST: { amount: 25.13, taxPercentage: 2.5 }, SGST: { amount: 25.12, taxPercentage: 2.5 } });
      expect(same).toMatchObject({ taxAmount: 50.25, placeOfSupplyStateCode: '27', hsnSacCode: '3004' });
      const other = await engine.calculate(goods({ deliveryStateCode: '29' }));
      expect(other.taxObj).toEqual({ IGST: { amount: 50.25, taxPercentage: 5 } });
      expect(other.placeOfSupplyStateCode).toBe('29');
    });

    it('goods delivered in India without a delivery State → 400 (the billing State is never a substitute, IGST s.10)', async () => {
      await expect(engine.calculate(goods({ deliveryStateCode: null, customerStateCode: '27' }))).rejects.toThrow('shipping address with a state');
      memumRegisteredAt5();
      await expect(engine.calculate(goods({ deliveryStateCode: null, customerStateCode: '27' }))).rejects.toThrow('shipping address with a state');
    });

    it('row 3 unregistered (seeded GST rule, no GSTIN): same-State delivery → no tax, plain invoice', async () => {
      const r = await engine.calculate(goods({}));
      expect(r).toMatchObject({ taxType: TaxTypeEnum.NONE, taxMode: TaxMode.NO_TAX, taxAmount: 0, placeOfSupplyStateCode: '27', hsnSacCode: '3004' });
    });

    it('row 4 unregistered: other-State (or unknown-State) delivery → refused by the seeded s.24(i) rule; changed to CHARGE by the owner → no tax', async () => {
      await expect(engine.calculate(goods({ deliveryStateCode: '29' }))).rejects.toThrow('CGST s.24(i)');
      await expect(engine.calculate(goods({ supplierStateCode: null }))).rejects.toThrow('CGST s.24(i)');
      await expect(harness.resolveOrThrow.mock.results[0].value).resolves.toMatchObject({ id: 7 });
      Object.assign(ruleById(rules, 7), { treatment: 'CHARGE', refusalMessage: null });
      const r = await engine.calculate(goods({ deliveryStateCode: '29' }));
      expect(r.taxMode).toBe(TaxMode.NO_TAX);
    });

    it('row 7 registered, LUT valid: delivery abroad → export of goods 0% under LUT, whatever the currency; export series', async () => {
      memumRegisteredAt5();
      harness.findValid.mockResolvedValue({ arn: LUT });
      const r = await engine.calculate(goods({ customerCountryCode: 'AE', customerStateCode: '1', deliveryCountryCode: 'AE', deliveryStateCode: '1', currency: 'INR' }));
      expect(r).toMatchObject({ taxMode: TaxMode.EXPORT_OF_GOODS, taxAmount: 0, isLutApplied: true, placeOfSupplyCountryCode: 'AE', placeOfSupplyStateCode: null });
      expect(series(r.taxMode, 'IN', 'AE', r.taxAmount)).toBe(InvoiceSeriesEnum.EXPORT);
    });

    it('row 7 registered, no LUT → export of goods with IGST 5 paid', async () => {
      memumRegisteredAt5();
      const r = await engine.calculate(goods({ customerCountryCode: 'AE', customerStateCode: '1', deliveryCountryCode: 'AE', deliveryStateCode: '1' }));
      expect(r).toMatchObject({ taxMode: TaxMode.EXPORT_OF_GOODS, taxAmount: 50.25, invoiceNote: EXPORT_WITH_IGST_NOTE });
    });

    it('row 7 unregistered: delivery abroad → refused (no LUT possible without a GSTIN)', async () => {
      await expect(
        engine.calculate(goods({ customerCountryCode: 'AE', customerStateCode: '1', deliveryCountryCode: 'AE', deliveryStateCode: '1' })),
      ).rejects.toThrow('not GST-registered');
    });
  });

  describe('UAE franchise (HCUAE)', () => {
    it('row 8: UAE client, seeded 0% Z → VAT 0 zero-rated, State stored, domestic series', async () => {
      const r = await engine.calculate(uae({}));
      expect(r).toMatchObject({ taxType: TaxTypeEnum.VAT, taxMode: TaxMode.VAT, taxPercentage: 0, taxCategory: TaxCategoryEnum.ZERO_RATED, placeOfSupplyCountryCode: 'AE', placeOfSupplyStateCode: '1' });
      expect(series(r.taxMode, 'AE', 'AE', r.taxAmount)).toBe(InvoiceSeriesEnum.DOMESTIC);
    });

    it('row 8 alternative: rule switched to 5% STANDARD (configuration) → VAT 5 S', async () => {
      hcuaeStandardRate();
      const r = await engine.calculate(uae({}));
      expect(r).toMatchObject({ taxPercentage: 5, taxAmount: 50.25, totalAmount: 1055.25, taxCategory: TaxCategoryEnum.STANDARD });
    });

    it('row 9: UAE goods rule 5% S → VAT 5 on the delivery country', async () => {
      hcuaeProductRule();
      const r = await engine.calculate(uae({ transactionType: TransactionType.PRODUCT, referenceId: 7, deliveryCountryCode: 'AE', deliveryStateCode: '1' }));
      expect(r).toMatchObject({ taxMode: TaxMode.VAT, taxPercentage: 5, taxCategory: TaxCategoryEnum.STANDARD, placeOfSupplyCountryCode: 'AE' });
    });

    it.each(['US', 'SA'])('row 10: client in %s (rest of world / GCC) → zero-rated export of services with the Art 31 note', async (country) => {
      hcuaeStandardRate();
      const r = await engine.calculate(uae({ customerCountryCode: country, currency: 'USD' }));
      expect(r).toMatchObject({ taxMode: TaxMode.VAT, taxAmount: 0, taxCategory: TaxCategoryEnum.ZERO_RATED, invoiceNote: UAE_ZERO_RATED_EXPORT_NOTE, placeOfSupplyCountryCode: country, placeOfSupplyStateCode: null });
      expect(r.taxDecisionReason).toContain('billing address');
      expect(series(r.taxMode, 'AE', country, r.taxAmount)).toBe(InvoiceSeriesEnum.DOMESTIC);
    });

    it('rows 11/13: goods delivered outside the UAE → zero-rated export of goods with the Art 30 note and the delivery reason', async () => {
      hcuaeProductRule();
      for (const country of ['US', 'IN']) {
        const r = await engine.calculate(
          uae({ transactionType: TransactionType.PRODUCT, referenceId: 7, customerCountryCode: 'US', deliveryCountryCode: country, deliveryStateCode: '1', currency: 'USD' }),
        );
        expect(r).toMatchObject({ taxMode: TaxMode.VAT, taxAmount: 0, taxCategory: TaxCategoryEnum.ZERO_RATED, invoiceNote: UAE_ZERO_RATED_GOODS_EXPORT_NOTE, placeOfSupplyCountryCode: country });
        expect(r.taxDecisionReason).toContain('delivery address');
      }
    });

    it('row 12: Indian client under the UAE franchise → refused before any rule lookup', async () => {
      await expect(engine.calculate(uae({ customerCountryCode: 'IN', customerStateCode: '27' }))).rejects.toThrow('Indian clients must be registered under the India franchise.');
      expect(harness.resolveOrThrow).not.toHaveBeenCalled();
    });

    it('A16: the supply date is the franchise local day (Asia/Dubai), not IST', async () => {
      // 2026-10-11 21:30 UTC = 2026-10-12 01:30 Dubai, 03:00 IST → both 10-12; 19:30 UTC = 23:30 Dubai (10-11) vs 01:00 IST (10-12)
      await engine.calculate(uae({ supplyDate: '2026-10-11T19:30:00.000Z' }));
      expect(harness.resolveOrThrow.mock.calls[0][0].supplyDate).toBe('2026-10-11');
      harness.resolveOrThrow.mockClear();
      await engine.calculate(svc({ supplyDate: '2026-10-11T19:30:00.000Z' }));
      expect(harness.resolveOrThrow.mock.calls[0][0].supplyDate).toBe('2026-10-12');
    });
  });

  describe('A17 rounding', () => {
    it('an odd paisa splits CGST/SGST so they add up to the printed tax', async () => {
      // 1000.05 × 18% = 180.009 → 180.01 → CGST 90.01 (round half up), SGST 90.00
      const r = await engine.calculate(svc({ baseAmount: 1000.05 }));
      expect(r.taxAmount).toBe(180.01);
      expect(r.taxObj.CGST.amount + r.taxObj.SGST.amount).toBeCloseTo(r.taxAmount, 10);
      expect(r.totalAmount).toBe(1180.06);
    });

    it('IGST is rounded to 2 dp', async () => {
      const r = await engine.calculate(svc({ baseAmount: 333.33, customerStateCode: '29' }));
      expect(r.taxObj).toEqual({ IGST: { amount: 60, taxPercentage: 18 } });
      expect(r.totalAmount).toBe(393.33);
    });
  });
});
