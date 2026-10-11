import { CountryService, InvoiceSeriesUtil } from '@server_1/platform';
import { MstFranchise } from '@server_1/core';
import {
  EXPORT_UNDER_LUT_NOTE,
  EXPORT_WITH_IGST_NOTE,
  IndiaGstService,
  LutService,
  TaxEngineService,
  TaxInput,
  UAE_ZERO_RATED_EXPORT_NOTE,
  UAE_ZERO_RATED_GOODS_EXPORT_NOTE,
  UsSalesTaxService,
  VatService,
} from '@server_1/modules/tax-engine';
import {
  InvoiceSeriesEnum,
  PaymentRouteEnum,
  TaxCategoryEnum,
  TaxMode,
  TaxTypeEnum,
  TransactionType,
} from '@eatfit247-shared-lib';

/**
 * Spec 2026-10-10-tax-mapping-matrix, group 3: one case per row of the legal mapping table
 * (requirements.md § "The mapping table") and its variants. The rules are the migration-144 seeds,
 * so this file also documents the seed. Row numbers in the names match the table.
 */
describe('Tax mapping matrix (franchise × customer × goods/services)', () => {
  type Rule = {
    taxSystem: TaxTypeEnum;
    taxPercent: number;
    isTaxInclusive: boolean;
    taxCategory: TaxCategoryEnum;
    hsnSacCode: string | null;
  };
  // 144 seeds
  const EFMUM_GST_18: Rule = { taxSystem: TaxTypeEnum.GST, taxPercent: 18, isTaxInclusive: false, taxCategory: TaxCategoryEnum.STANDARD, hsnSacCode: '999319' };
  const HCUAE_VAT_0_Z: Rule = { taxSystem: TaxTypeEnum.VAT, taxPercent: 0, isTaxInclusive: false, taxCategory: TaxCategoryEnum.ZERO_RATED, hsnSacCode: '999319' };
  const MEMUM_NONE: Rule = { taxSystem: TaxTypeEnum.NONE, taxPercent: 0, isTaxInclusive: false, taxCategory: TaxCategoryEnum.STANDARD, hsnSacCode: '3004' };
  // staged (inactive until the CA confirms Mahi's registration)
  const MEMUM_GST_5: Rule = { taxSystem: TaxTypeEnum.GST, taxPercent: 5, isTaxInclusive: false, taxCategory: TaxCategoryEnum.STANDARD, hsnSacCode: '3004' };
  // configuration alternatives
  const HCUAE_VAT_5_S: Rule = { ...HCUAE_VAT_0_Z, taxPercent: 5, taxCategory: TaxCategoryEnum.STANDARD };
  const PLAN_RULE_5: Rule = { ...EFMUM_GST_18, taxPercent: 5, hsnSacCode: '999723' };

  const EFMUM = 1;
  const HCUAE = 2;
  const MEMUM = 3;
  const LUT = 'AD270326000001T';

  let rules: Record<string, Rule | null>;
  let franchises: Record<number, { gstNumber: string | null; vatNumber: string | null; timeZone: string | null }>;
  let lutValidity: { from: string; to: string } | null;
  let allowUnregisteredInterstate: boolean;
  let getApplicableTaxRule: jest.Mock;
  let findValid: jest.Mock;
  let engine: TaxEngineService;

  const ruleKey = (franchiseId: number, type: TransactionType, referenceId: number): string => `${franchiseId}/${type}/${referenceId}`;

  beforeEach(() => {
    rules = {
      [ruleKey(EFMUM, TransactionType.SERVICE, 1)]: EFMUM_GST_18,
      [ruleKey(HCUAE, TransactionType.SERVICE, 1)]: HCUAE_VAT_0_Z,
      [ruleKey(MEMUM, TransactionType.PRODUCT, 1)]: MEMUM_NONE,
    };
    franchises = {
      [EFMUM]: { gstNumber: '27CSEPS5397E1Z8', vatNumber: null, timeZone: 'Asia/Kolkata' },
      [HCUAE]: { gstNumber: null, vatNumber: '100000000000003', timeZone: 'Asia/Dubai' },
      [MEMUM]: { gstNumber: null, vatNumber: null, timeZone: 'Asia/Kolkata' },
    };
    lutValidity = { from: '2026-04-01', to: '2027-03-31' };
    allowUnregisteredInterstate = false;
    // Same fallback as TaxMasterService: a SERVICE lookup without its own row uses reference 1
    getApplicableTaxRule = jest.fn().mockImplementation(async (l: { franchiseId: number; transactionType: TransactionType; referenceId: number }) => {
      const own = rules[ruleKey(l.franchiseId, l.transactionType, l.referenceId)];
      if (own !== undefined || l.transactionType !== TransactionType.SERVICE) {
        return own ?? null;
      }
      return rules[ruleKey(l.franchiseId, l.transactionType, 1)] ?? null;
    });
    findValid = jest.fn().mockImplementation(async (franchiseId: number, date: string) =>
      franchiseId === EFMUM && lutValidity && date >= lutValidity.from && date <= lutValidity.to ? { arn: LUT } : null,
    );
    engine = new TaxEngineService(
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
      { getApplicableTaxRule } as never,
      { findValid } as unknown as LutService,
      { findByPk: jest.fn().mockImplementation(async (id: number) => franchises[id] ?? null) } as unknown as typeof MstFranchise,
      { getBoolean: jest.fn().mockImplementation(() => allowUnregisteredInterstate) } as never,
    );
  });

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
      rules[ruleKey(EFMUM, TransactionType.SERVICE, 42)] = PLAN_RULE_5;
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

    it('row 14: the electronic-service flag changes nothing in the engine (adviser decision pending)', async () => {
      const r = await engine.calculate(svc({ customerCountryCode: 'AE', customerStateCode: '1', currency: 'USD' }));
      expect(r).toMatchObject({ taxMode: TaxMode.EXPORT_OF_SERVICE, taxAmount: 0 });
    });
  });

  describe('India franchise, goods (MEMUM)', () => {
    it('rows 3/4 with the staged GST 5% rule active: same State → CGST 2.5 + SGST 2.5; other State → IGST 5; HSN 3004', async () => {
      rules[ruleKey(MEMUM, TransactionType.PRODUCT, 1)] = MEMUM_GST_5;
      franchises[MEMUM].gstNumber = '27AAAAA0000A1Z5';
      const same = await engine.calculate(goods({}));
      expect(same.taxObj).toEqual({ CGST: { amount: 25.13, taxPercentage: 2.5 }, SGST: { amount: 25.12, taxPercentage: 2.5 } });
      expect(same).toMatchObject({ taxAmount: 50.25, placeOfSupplyStateCode: '27', hsnSacCode: '3004' });
      const other = await engine.calculate(goods({ deliveryStateCode: '29' }));
      expect(other.taxObj).toEqual({ IGST: { amount: 50.25, taxPercentage: 5 } });
      expect(other.placeOfSupplyStateCode).toBe('29');
    });

    it('goods delivered in India without a delivery State → 400 (the billing State is never a substitute, IGST s.10)', async () => {
      rules[ruleKey(MEMUM, TransactionType.PRODUCT, 1)] = MEMUM_GST_5;
      franchises[MEMUM].gstNumber = '27AAAAA0000A1Z5';
      await expect(engine.calculate(goods({ deliveryStateCode: null, customerStateCode: '27' }))).rejects.toThrow('shipping address with a state');
      rules[ruleKey(MEMUM, TransactionType.PRODUCT, 1)] = MEMUM_NONE;
      franchises[MEMUM].gstNumber = null;
      await expect(engine.calculate(goods({ deliveryStateCode: null, customerStateCode: '27' }))).rejects.toThrow('shipping address with a state');
    });

    it('row 3 unregistered (seeded NONE): same-State delivery → no tax, plain invoice', async () => {
      const r = await engine.calculate(goods({}));
      expect(r).toMatchObject({ taxType: TaxTypeEnum.NONE, taxMode: TaxMode.NO_TAX, taxAmount: 0, placeOfSupplyStateCode: '27', hsnSacCode: '3004' });
    });

    it('row 4 unregistered: other-State delivery → refused under CGST s.24(i) unless the CA override is on', async () => {
      await expect(engine.calculate(goods({ deliveryStateCode: '29' }))).rejects.toThrow('CGST s.24(i)');
      allowUnregisteredInterstate = true;
      const r = await engine.calculate(goods({ deliveryStateCode: '29' }));
      expect(r.taxMode).toBe(TaxMode.NO_TAX);
    });

    it('row 7 registered, LUT valid: delivery abroad → export of goods 0% under LUT, whatever the currency; export series', async () => {
      rules[ruleKey(MEMUM, TransactionType.PRODUCT, 1)] = MEMUM_GST_5;
      franchises[MEMUM].gstNumber = '27AAAAA0000A1Z5';
      findValid.mockResolvedValue({ arn: LUT });
      const r = await engine.calculate(goods({ customerCountryCode: 'AE', customerStateCode: '1', deliveryCountryCode: 'AE', deliveryStateCode: '1', currency: 'INR' }));
      expect(r).toMatchObject({ taxMode: TaxMode.EXPORT_OF_GOODS, taxAmount: 0, isLutApplied: true, placeOfSupplyCountryCode: 'AE', placeOfSupplyStateCode: null });
      expect(series(r.taxMode, 'IN', 'AE', r.taxAmount)).toBe(InvoiceSeriesEnum.EXPORT);
    });

    it('row 7 registered, no LUT → export of goods with IGST 5 paid', async () => {
      rules[ruleKey(MEMUM, TransactionType.PRODUCT, 1)] = MEMUM_GST_5;
      franchises[MEMUM].gstNumber = '27AAAAA0000A1Z5';
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
      rules[ruleKey(HCUAE, TransactionType.SERVICE, 1)] = HCUAE_VAT_5_S;
      const r = await engine.calculate(uae({}));
      expect(r).toMatchObject({ taxPercentage: 5, taxAmount: 50.25, totalAmount: 1055.25, taxCategory: TaxCategoryEnum.STANDARD });
    });

    it('row 9: UAE goods rule 5% S → VAT 5 on the delivery country', async () => {
      rules[ruleKey(HCUAE, TransactionType.PRODUCT, 7)] = HCUAE_VAT_5_S;
      const r = await engine.calculate(uae({ transactionType: TransactionType.PRODUCT, referenceId: 7, deliveryCountryCode: 'AE', deliveryStateCode: '1' }));
      expect(r).toMatchObject({ taxMode: TaxMode.VAT, taxPercentage: 5, taxCategory: TaxCategoryEnum.STANDARD, placeOfSupplyCountryCode: 'AE' });
    });

    it.each(['US', 'SA'])('row 10: client in %s (rest of world / GCC) → zero-rated export of services with the Art 31 note', async (country) => {
      rules[ruleKey(HCUAE, TransactionType.SERVICE, 1)] = HCUAE_VAT_5_S;
      const r = await engine.calculate(uae({ customerCountryCode: country, currency: 'USD' }));
      expect(r).toMatchObject({ taxMode: TaxMode.VAT, taxAmount: 0, taxCategory: TaxCategoryEnum.ZERO_RATED, invoiceNote: UAE_ZERO_RATED_EXPORT_NOTE, placeOfSupplyCountryCode: country, placeOfSupplyStateCode: null });
      expect(r.taxDecisionReason).toContain('billing address');
      expect(series(r.taxMode, 'AE', country, r.taxAmount)).toBe(InvoiceSeriesEnum.DOMESTIC);
    });

    it('rows 11/13: goods delivered outside the UAE → zero-rated export of goods with the Art 30 note and the delivery reason', async () => {
      rules[ruleKey(HCUAE, TransactionType.PRODUCT, 7)] = HCUAE_VAT_5_S;
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
      expect(getApplicableTaxRule).not.toHaveBeenCalled();
    });

    it('A16: the supply date is the franchise local day (Asia/Dubai), not IST', async () => {
      // 2026-10-11 21:30 UTC = 2026-10-12 01:30 Dubai, 03:00 IST → both 10-12; 19:30 UTC = 23:30 Dubai (10-11) vs 01:00 IST (10-12)
      await engine.calculate(uae({ supplyDate: '2026-10-11T19:30:00.000Z' }));
      expect(getApplicableTaxRule.mock.calls[0][0].onDate).toBe('2026-10-11');
      getApplicableTaxRule.mockClear();
      await engine.calculate(svc({ supplyDate: '2026-10-11T19:30:00.000Z' }));
      expect(getApplicableTaxRule.mock.calls[0][0].onDate).toBe('2026-10-12');
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
