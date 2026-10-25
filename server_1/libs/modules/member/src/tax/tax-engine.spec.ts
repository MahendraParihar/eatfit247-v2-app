import { BadRequestException } from '@nestjs/common';
import {
  EXPORT_UNDER_LUT_NOTE,
  EXPORT_WITH_IGST_NOTE,
  TaxEngineService,
  TaxInput,
  UAE_ZERO_RATED_EXPORT_NOTE,
} from '@server_1/modules/tax-engine';
import {
  PaymentRouteEnum,
  TaxCategoryEnum,
  TaxMode,
  TaxTypeEnum,
  TransactionType,
} from '@eatfit247-shared-lib';
import { EFMUM, EngineHarness, HCUAE, MEMUM, SeedRule, engineHarness, ruleById } from './seeded-tax-rules.fixture';

/**
 * Roadmap 4.6 group 2: the tax decision matrix (validation A1–A12, A22), on the migration-146 rules through the
 * real resolver since configurable tax treatment group 6. MEMUM is GST-registered here, at its seeded 12%
 * tax-inclusive rate (rows 3 and 8).
 */
describe('TaxEngineService decision matrix', () => {
  let harness: EngineHarness;
  let rules: SeedRule[];
  let lut: { arn: string } | null;
  let engine: TaxEngineService;

  beforeEach(() => {
    lut = { arn: 'AD270326000123X' };
    harness = engineHarness({ lut: () => lut });
    harness.registrations[MEMUM] = [{ taxRegistrationId: 3, taxSystem: TaxTypeEnum.GST, countryCode: 'IN' }];
    rules = harness.rules;
    engine = harness.engine;
  });

  const service = (overrides: Partial<TaxInput>): TaxInput => ({
    baseAmount: 1000,
    discountAmount: 0,
    franchiseId: EFMUM,
    referenceId: 1,
    supplierCountryCode: 'IN',
    supplierStateCode: 'MH',
    customerCountryCode: 'IN',
    customerStateCode: 'MH',
    currency: 'INR',
    transactionType: TransactionType.SERVICE,
    supplyDate: '2026-10-12',
    ...overrides,
  });

  describe('registrations on the supply date (configurable tax treatment 4.2 / 4b.5)', () => {
    it('asks for the registrations effective on the supply date', async () => {
      await engine.calculate(service({ supplyDate: '2017-05-02' }));
      expect(harness.findActive).toHaveBeenCalledWith(EFMUM, '2017-05-02');
    });

    it('a sale dated before the GST registration starts prices as unregistered (no GST)', async () => {
      harness.findActive.mockResolvedValueOnce([]);
      const r = await engine.calculate(service({}));
      expect(r).toMatchObject({ taxType: TaxTypeEnum.NONE, taxMode: TaxMode.NO_TAX, taxAmount: 0 });
    });

    it('a VAT rule with no VAT registration effective on the supply date → 400', async () => {
      harness.findActive.mockResolvedValueOnce([]);
      await expect(engine.calculate(service({ franchiseId: HCUAE, supplierCountryCode: 'AE', customerCountryCode: 'AE', currency: 'AED' }))).rejects.toThrow('no TRN');
    });
  });

  describe('EFMUM (India, services)', () => {
    it('A1 same state → CGST 9% + SGST 9%, DOMESTIC_GST', async () => {
      const r = await engine.calculate(service({}));
      expect(r).toMatchObject({ taxMode: TaxMode.DOMESTIC_GST, taxAmount: 180, totalAmount: 1180, isLutApplied: false });
      expect(r.taxObj).toEqual({ CGST: { amount: 90, taxPercentage: 9 }, SGST: { amount: 90, taxPercentage: 9 } });
      expect(r.taxDecisionReason).toContain('same state');
    });

    it('A1 another Indian state → IGST 18%', async () => {
      const r = await engine.calculate(service({ customerStateCode: 'KA' }));
      expect(r.taxObj).toEqual({ IGST: { amount: 180, taxPercentage: 18 } });
    });

    it('A2 Indian billing address without a state → 400, no silent IGST', async () => {
      await expect(engine.calculate(service({ customerStateCode: null }))).rejects.toThrow('billing state is required');
    });

    it('A3 US client, USD order, valid LUT → 0% export of service with the LUT ARN and endorsement', async () => {
      const r = await engine.calculate(service({ customerCountryCode: 'US', customerStateCode: 'NY', currency: 'USD' }));
      expect(r).toMatchObject({
        taxType: TaxTypeEnum.GST,
        taxMode: TaxMode.EXPORT_OF_SERVICE,
        taxAmount: 0,
        totalAmount: 1000,
        isLutApplied: true,
        lutArn: 'AD270326000123X',
        invoiceNote: EXPORT_UNDER_LUT_NOTE,
        paymentRoute: PaymentRouteEnum.INTERNATIONAL_CARD_GATEWAY,
        entityCountry: 'India',
        customerCountry: 'United States',
        placeOfSupply: 'United States',
      });
      expect(harness.findValid).toHaveBeenCalledWith(EFMUM, '2026-10-12');
    });

    it('A4 US client, USD order, no valid LUT → export with IGST 18% and the "on payment" endorsement', async () => {
      lut = null;
      const r = await engine.calculate(service({ customerCountryCode: 'US', currency: 'USD' }));
      expect(r).toMatchObject({
        taxMode: TaxMode.EXPORT_OF_SERVICE,
        taxAmount: 180,
        isLutApplied: false,
        lutArn: null,
        invoiceNote: EXPORT_WITH_IGST_NOTE,
      });
      expect(r.taxObj).toEqual({ IGST: { amount: 180, taxPercentage: 18 } });
      expect(r.taxDecisionReason).toContain('no valid LUT on 2026-10-12');
    });

    it('A5 US client paying INR (gateway or DOMESTIC route) → IGST 18%, not an export', async () => {
      for (const paymentRoute of [undefined, PaymentRouteEnum.DOMESTIC]) {
        const r = await engine.calculate(service({ customerCountryCode: 'US', currency: 'INR', paymentRoute }));
        expect(r).toMatchObject({ taxMode: TaxMode.DOMESTIC_GST, taxAmount: 180, isLutApplied: false, invoiceNote: undefined });
        expect(r.taxObj).toEqual({ IGST: { amount: 180, taxPercentage: 18 } });
        expect(r.taxDecisionReason).toContain('not an export');
      }
    });

    it('a manual USD payment left on the DOMESTIC route is still foreign money → export', async () => {
      const r = await engine.calculate(
        service({ customerCountryCode: 'US', currency: 'USD', paymentRoute: PaymentRouteEnum.DOMESTIC }),
      );
      expect(r).toMatchObject({ taxMode: TaxMode.EXPORT_OF_SERVICE, paymentRoute: PaymentRouteEnum.FOREIGN_REMITTANCE });
    });

    it.each([PaymentRouteEnum.FOREIGN_REMITTANCE, PaymentRouteEnum.RUPEE_VOSTRO, PaymentRouteEnum.NRE_FCNR_ACCOUNT])(
      'A6/A7 US client paying INR via %s → export (0% under LUT)',
      async (paymentRoute) => {
        const r = await engine.calculate(service({ customerCountryCode: 'US', currency: 'INR', paymentRoute }));
        expect(r).toMatchObject({ taxMode: TaxMode.EXPORT_OF_SERVICE, taxAmount: 0, isLutApplied: true, paymentRoute });
      },
    );
  });

  describe('MEMUM (India, goods, tax-inclusive prices)', () => {
    const goods = (overrides: Partial<TaxInput>): TaxInput =>
      service({ franchiseId: MEMUM, transactionType: TransactionType.PRODUCT, baseAmount: 1120, ...overrides });

    it('A8 delivered abroad → EXPORT_OF_GOODS 0% under LUT, whatever the currency', async () => {
      const r = await engine.calculate(goods({ customerCountryCode: 'US', deliveryCountryCode: 'US', currency: 'INR' }));
      expect(r).toMatchObject({ taxMode: TaxMode.EXPORT_OF_GOODS, taxAmount: 0, isLutApplied: true, lutArn: 'AD270326000123X' });
      expect(r.totalAmount).toBeCloseTo(1000, 2);
    });

    it('A8 delivered abroad without a LUT → EXPORT_OF_GOODS with IGST', async () => {
      lut = null;
      const r = await engine.calculate(goods({ customerCountryCode: 'US', deliveryCountryCode: 'US' }));
      expect(r).toMatchObject({ taxMode: TaxMode.EXPORT_OF_GOODS, invoiceNote: EXPORT_WITH_IGST_NOTE });
      expect(r.taxAmount).toBeCloseTo(120, 2);
    });

    it('a product order without a shipping address is refused (not taxed by the billing country)', async () => {
      await expect(engine.calculate(goods({ customerCountryCode: 'US', deliveryCountryCode: null }))).rejects.toThrow(
        'shipping address',
      );
    });

    describe('matrix decision 13: GST rule, no GSTIN on the franchise', () => {
      beforeEach(() => {
        harness.registrations[MEMUM] = [];
      });

      it('same-State delivery → no tax, the inclusive price charged in full', async () => {
        const r = await engine.calculate(goods({ deliveryCountryCode: 'IN', deliveryStateCode: 'MH' }));
        expect(r).toMatchObject({ taxType: TaxTypeEnum.NONE, taxMode: TaxMode.NO_TAX, taxAmount: 0, taxObj: {} });
        expect(r.totalAmount).toBeCloseTo(1120, 2);
        expect(r.taxDecisionReason).toBe('No GSTIN on the franchise: invoiced without GST');
      });

      it('inter-state delivery → refused (CGST s.24(i))', async () => {
        await expect(engine.calculate(goods({ deliveryCountryCode: 'IN', deliveryStateCode: 'KA' }))).rejects.toThrow('s.24(i)');
      });

      it('delivery abroad → refused (no LUT without registration)', async () => {
        await expect(engine.calculate(goods({ customerCountryCode: 'US', deliveryCountryCode: 'US' }))).rejects.toThrow(
          'not GST-registered',
        );
      });

      it('GSTIN added → GST at the configured rule rate again', async () => {
        harness.registrations[MEMUM] = [{ taxRegistrationId: 3, taxSystem: TaxTypeEnum.GST, countryCode: 'IN' }];
        const r = await engine.calculate(goods({ deliveryCountryCode: 'IN', deliveryStateCode: 'MH' }));
        expect(r.taxMode).toBe(TaxMode.DOMESTIC_GST);
        expect(r.taxAmount).toBeCloseTo(120, 2);
      });
    });

    it('A8 delivered in India → GST by the delivery state', async () => {
      const r = await engine.calculate(goods({ deliveryCountryCode: 'IN', deliveryStateCode: 'KA' }));
      expect(r.taxMode).toBe(TaxMode.DOMESTIC_GST);
      expect(Object.keys(r.taxObj)).toEqual(['IGST']);
      expect(r.taxAmount).toBeCloseTo(120, 2);
    });
  });

  describe('HCUAE (UAE VAT)', () => {
    const uae = (overrides: Partial<TaxInput>): TaxInput =>
      service({ franchiseId: HCUAE, supplierCountryCode: 'AE', supplierStateCode: null, customerCountryCode: 'AE', currency: 'AED', ...overrides });

    it('A9 UAE client, rule 0% ZERO_RATED → VAT 0%, category Z (not NONE)', async () => {
      const r = await engine.calculate(uae({}));
      expect(r).toMatchObject({ taxType: TaxTypeEnum.VAT, taxMode: TaxMode.VAT, taxPercentage: 0, taxAmount: 0, taxCategory: TaxCategoryEnum.ZERO_RATED });
      expect(r.taxObj).toEqual({ VAT: { amount: 0, taxPercentage: 0 } });
    });

    it('A9 the rule changed to 5% STANDARD (config only) → VAT 5%, category S', async () => {
      Object.assign(ruleById(rules, 2), { taxPercent: 5, taxCategory: TaxCategoryEnum.STANDARD });
      const r = await engine.calculate(uae({}));
      expect(r).toMatchObject({ taxPercentage: 5, taxAmount: 50, totalAmount: 1050, taxCategory: TaxCategoryEnum.STANDARD });
    });

    it('A10 US client → zero-rated export (Z) with the evidence note, even when the UAE rate is 5%', async () => {
      Object.assign(ruleById(rules, 2), { taxPercent: 5, taxCategory: TaxCategoryEnum.STANDARD });
      const r = await engine.calculate(uae({ customerCountryCode: 'US', currency: 'USD' }));
      expect(r).toMatchObject({ taxMode: TaxMode.VAT, taxAmount: 0, taxCategory: TaxCategoryEnum.ZERO_RATED, invoiceNote: UAE_ZERO_RATED_EXPORT_NOTE });
    });

    it('A11 Indian client under the UAE franchise → refused', async () => {
      await expect(engine.calculate(uae({ customerCountryCode: 'IN', customerStateCode: 'MH' }))).rejects.toThrow(
        'Indian clients must be registered under the India franchise.',
      );
      expect(harness.resolveOrThrow).not.toHaveBeenCalled();
    });

    it('an unregistered franchise (NONE rule) → no tax line', async () => {
      ruleById(rules, 2).taxSystem = TaxTypeEnum.NONE;
      const r = await engine.calculate(uae({}));
      expect(r).toMatchObject({ taxType: TaxTypeEnum.NONE, taxMode: TaxMode.NO_TAX, taxAmount: 0 });
      expect(r.taxDecisionReason).toContain('not registered');
    });
  });

  describe('configuration and data errors', () => {
    it('A12 no active rule → 400 naming the franchise, country and type', async () => {
      ruleById(rules, 1).active = false;
      await expect(engine.calculate(service({}))).rejects.toThrow('No active tax rule for franchise 1, country IN, SERVICE');
    });

    it('resolves the rule on the supplier country, place of supply, money, transaction type and supply date', async () => {
      await engine.calculate(service({ customerCountryCode: 'US', currency: 'USD' }));
      expect(harness.resolveOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({
          franchiseId: EFMUM,
          supplierCountryCode: 'IN',
          placeOfSupplyCountryCode: 'US',
          money: 'FOREIGN',
          transactionType: TransactionType.SERVICE,
          supplyDate: '2026-10-12',
        }),
      );
    });

    it('missing franchise country or billing country → 400', async () => {
      await expect(engine.calculate(service({ supplierCountryCode: null }))).rejects.toThrow('franchise address has no country');
      await expect(engine.calculate(service({ customerCountryCode: '' }))).rejects.toThrow(BadRequestException);
    });

    it('trims CHAR(3) padding on country codes', async () => {
      const r = await engine.calculate(service({ supplierCountryCode: 'IN ', customerCountryCode: ' in' }));
      expect(r.taxMode).toBe(TaxMode.DOMESTIC_GST);
    });

    it('A22 a VAT rule on a franchise without a TRN → 400', async () => {
      harness.registrations[HCUAE] = [];
      await expect(
        engine.calculate(service({ franchiseId: HCUAE, supplierCountryCode: 'AE', customerCountryCode: 'AE' })),
      ).rejects.toThrow('no TRN');
    });

    it('A22 an unregistered Indian franchise cannot invoice an export', async () => {
      harness.registrations[MEMUM] = [];
      await expect(
        engine.calculate(service({ franchiseId: MEMUM, transactionType: TransactionType.PRODUCT, customerCountryCode: 'US', deliveryCountryCode: 'US' })),
      ).rejects.toThrow('not GST-registered');
    });
  });
});
