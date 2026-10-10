import { BadRequestException } from '@nestjs/common';
import { CountryService } from '@server_1/platform';
import { MstFranchise } from '@server_1/core';
import {
  EXPORT_UNDER_LUT_NOTE,
  EXPORT_WITH_IGST_NOTE,
  IndiaGstService,
  LutService,
  TaxEngineService,
  TaxInput,
  UAE_ZERO_RATED_EXPORT_NOTE,
  UsSalesTaxService,
  VatService,
} from '@server_1/modules/tax-engine';
import {
  PaymentRouteEnum,
  TaxCategoryEnum,
  TaxMode,
  TaxTypeEnum,
  TransactionType,
} from '@eatfit247-shared-lib';

/** Roadmap 4.6 group 2: the tax decision matrix (validation A1–A12, A22). */
describe('TaxEngineService decision matrix', () => {
  type Rule = { taxSystem: TaxTypeEnum; taxPercent: number; isTaxInclusive: boolean; taxCategory: TaxCategoryEnum };
  const GST18: Rule = { taxSystem: TaxTypeEnum.GST, taxPercent: 18, isTaxInclusive: false, taxCategory: TaxCategoryEnum.STANDARD };
  const GST12_INCL: Rule = { taxSystem: TaxTypeEnum.GST, taxPercent: 12, isTaxInclusive: true, taxCategory: TaxCategoryEnum.STANDARD };
  const VAT0_Z: Rule = { taxSystem: TaxTypeEnum.VAT, taxPercent: 0, isTaxInclusive: false, taxCategory: TaxCategoryEnum.ZERO_RATED };
  const VAT5_S: Rule = { taxSystem: TaxTypeEnum.VAT, taxPercent: 5, isTaxInclusive: false, taxCategory: TaxCategoryEnum.STANDARD };
  const NONE: Rule = { taxSystem: TaxTypeEnum.NONE, taxPercent: 0, isTaxInclusive: false, taxCategory: TaxCategoryEnum.STANDARD };

  let rules: Record<number, Rule | null>;
  let franchises: Record<number, { gstNumber: string | null; vatNumber: string | null }>;
  let lut: { arn: string } | null;
  let getApplicableTaxRule: jest.Mock;
  let findValid: jest.Mock;
  let engine: TaxEngineService;

  const EFMUM = 1;
  const HCUAE = 2;
  const MEMUM = 3;

  beforeEach(() => {
    rules = { [EFMUM]: GST18, [HCUAE]: VAT0_Z, [MEMUM]: GST12_INCL };
    franchises = {
      [EFMUM]: { gstNumber: '27CSEPS5397E1Z8', vatNumber: null },
      [HCUAE]: { gstNumber: null, vatNumber: '100000000000003' },
      [MEMUM]: { gstNumber: '27AAAAA0000A1Z5', vatNumber: null },
    };
    lut = { arn: 'AD270326000123X' };
    getApplicableTaxRule = jest.fn().mockImplementation(async (lookup: { franchiseId: number }) => rules[lookup.franchiseId]);
    findValid = jest.fn().mockImplementation(async () => lut);
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
          ],
          count: 3,
        }),
      } as unknown as CountryService,
      { getApplicableTaxRule } as never,
      { findValid } as unknown as LutService,
      {
        findByPk: jest.fn().mockImplementation(async (id: number) => franchises[id] ?? null),
      } as unknown as typeof MstFranchise,
    );
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
      expect(findValid).toHaveBeenCalledWith(EFMUM, '2026-10-12');
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
      rules[HCUAE] = VAT5_S;
      const r = await engine.calculate(uae({}));
      expect(r).toMatchObject({ taxPercentage: 5, taxAmount: 50, totalAmount: 1050, taxCategory: TaxCategoryEnum.STANDARD });
    });

    it('A10 US client → zero-rated export (Z) with the evidence note, even when the UAE rate is 5%', async () => {
      rules[HCUAE] = VAT5_S;
      const r = await engine.calculate(uae({ customerCountryCode: 'US', currency: 'USD' }));
      expect(r).toMatchObject({ taxMode: TaxMode.VAT, taxAmount: 0, taxCategory: TaxCategoryEnum.ZERO_RATED, invoiceNote: UAE_ZERO_RATED_EXPORT_NOTE });
    });

    it('A11 Indian client under the UAE franchise → refused', async () => {
      await expect(engine.calculate(uae({ customerCountryCode: 'IN', customerStateCode: 'MH' }))).rejects.toThrow(
        'Indian clients must be registered under the India franchise.',
      );
      expect(getApplicableTaxRule).not.toHaveBeenCalled();
    });

    it('an unregistered franchise (NONE rule) → no tax line', async () => {
      rules[HCUAE] = NONE;
      const r = await engine.calculate(uae({}));
      expect(r).toMatchObject({ taxType: TaxTypeEnum.NONE, taxMode: TaxMode.NO_TAX, taxAmount: 0 });
      expect(r.taxDecisionReason).toContain('not registered');
    });
  });

  describe('configuration and data errors', () => {
    it('A12 no active rule → 400 naming the franchise, country and type', async () => {
      rules[EFMUM] = null;
      await expect(engine.calculate(service({}))).rejects.toThrow('No active tax rule for franchise 1, country IN, SERVICE');
    });

    it('looks the rule up by the supplier country, transaction type and supply date', async () => {
      await engine.calculate(service({ customerCountryCode: 'US', currency: 'USD' }));
      expect(getApplicableTaxRule).toHaveBeenCalledWith(
        expect.objectContaining({ franchiseId: EFMUM, countryCode: 'IN', transactionType: TransactionType.SERVICE }),
      );
      expect(getApplicableTaxRule.mock.calls[0][0].onDate).toBe('2026-10-12');
    });

    it('missing franchise country or billing country → 400', async () => {
      await expect(engine.calculate(service({ supplierCountryCode: null }))).rejects.toThrow('franchise address has no country');
      await expect(engine.calculate(service({ customerCountryCode: '' }))).rejects.toThrow(BadRequestException);
    });

    it('trims CHAR(3) padding on country codes', async () => {
      const r = await engine.calculate(service({ supplierCountryCode: 'IN ', customerCountryCode: ' in' }));
      expect(r.taxMode).toBe(TaxMode.DOMESTIC_GST);
    });

    it('A22 a GST rule on a franchise without a GSTIN, or a VAT rule without a TRN → 400', async () => {
      franchises[EFMUM].gstNumber = null;
      await expect(engine.calculate(service({}))).rejects.toThrow('no GSTIN');
      franchises[HCUAE].vatNumber = '';
      await expect(
        engine.calculate(service({ franchiseId: HCUAE, supplierCountryCode: 'AE', customerCountryCode: 'AE' })),
      ).rejects.toThrow('no TRN');
    });

    it('A22 an unregistered Indian franchise cannot invoice an export', async () => {
      rules[MEMUM] = NONE;
      await expect(
        engine.calculate(service({ franchiseId: MEMUM, transactionType: TransactionType.PRODUCT, customerCountryCode: 'US', deliveryCountryCode: 'US' })),
      ).rejects.toThrow('not GST-registered');
    });
  });
});
