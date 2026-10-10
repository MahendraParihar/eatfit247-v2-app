import { InvoicePdfService } from '@server_1/platform';
import {
  IAddress,
  IFranchise,
  IMemberPayment,
  IMemberProduct,
  mapPaymentToInvoiceDocument,
  mapProductOrderToInvoiceDocument,
  PROFORMA_TITLE,
  TaxMode,
  TaxTypeEnum,
} from '@eatfit247-shared-lib';

describe('invoice mapper: proforma and invoice date', () => {
  const franchise = { companyName: 'EAT FIT 247', gstNumber: '27CSEPS5397E1Z8' } as unknown as IFranchise;
  const address = { postalAddress: 'Line 1', addressName: 'Home', cityVillage: 'Mumbai', state: 'Maharashtra' } as unknown as IAddress;

  const payment = (overrides: Partial<IMemberPayment>): IMemberPayment =>
    ({
      memberPaymentId: 1,
      memberName: 'Test Member',
      orderAmount: 1000,
      discountAmount: 0,
      taxAmount: 180,
      totalAmount: 1180,
      currency: 'INR',
      taxType: TaxTypeEnum.GST,
      taxMode: TaxMode.DOMESTIC_GST,
      taxObj: { CGST: { amount: 90, taxPercentage: 9 }, SGST: { amount: 90, taxPercentage: 9 } },
      ...overrides,
    }) as unknown as IMemberPayment;

  const product = (overrides: Partial<IMemberProduct>): IMemberProduct =>
    ({
      memberProductId: 7,
      memberName: 'Test Member',
      subTotalAmount: 500,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 500,
      currency: 'INR',
      orderItems: [
        {
          taxType: TaxTypeEnum.NONE,
          taxMode: TaxMode.NO_TAX,
          quantity: 1,
          baseAmount: 500,
          totalAmount: 500,
          taxAmount: 0,
          product: { productName: 'Debloat' },
          variant: { variantName: '100g' },
        },
      ],
      ...overrides,
    }) as unknown as IMemberProduct;

  it('renders an unpaid plan payment as a proforma with no number, no QR and the GST note', () => {
    const doc = mapPaymentToInvoiceDocument(payment({ invoiceId: undefined }), franchise, address, address, []);

    expect(doc.header.title).toBe(PROFORMA_TITLE);
    expect(doc.header.invoiceNumber).toBe('');
    expect(doc.header.isProforma).toBe(true);
    expect(doc.qrCode?.enabled ?? false).toBe(false);
    expect(doc.tax.note).toBe('This is a proforma invoice and not a tax invoice under GST.');
  });

  it('renders an issued plan payment as a tax invoice dated by invoice_date, not payment_date', () => {
    const doc = mapPaymentToInvoiceDocument(
      payment({
        invoiceId: 'EFMUM/2026-27/S/000010',
        invoiceDate: '2026-10-12',
        paymentDate: new Date('2026-09-30T10:00:00Z'),
      }),
      franchise,
      address,
      address,
      [],
    );

    expect(doc.header.title).toBe('TAX INVOICE');
    expect(doc.header.invoiceNumber).toBe('EFMUM/2026-27/S/000010');
    expect(doc.header.isProforma).toBe(false);
    expect(doc.header.invoiceDate).toBe('2026-10-12');
  });

  it('falls back to payment_date for invoices issued before invoice_date existed', () => {
    const paid = new Date('2026-06-15T05:00:00Z');
    const doc = mapPaymentToInvoiceDocument(
      payment({ invoiceId: 'EFMUM/2026-27/S/000003', invoiceDate: null, paymentDate: paid }),
      franchise,
      address,
      address,
      [],
    );

    expect(doc.header.invoiceDate).toBe(paid.toString());
  });

  it('keeps the existing tax note after the proforma note for a non-GST proforma', () => {
    const doc = mapPaymentToInvoiceDocument(
      payment({ invoiceId: '', taxType: TaxTypeEnum.NONE, taxMode: TaxMode.NO_TAX, taxAmount: 0, taxObj: {} }),
      franchise,
      address,
      address,
      [],
    );

    expect(doc.header.title).toBe(PROFORMA_TITLE);
    expect(doc.tax.note).toBe('This is a proforma invoice and not a tax invoice. No Tax Applicable');
  });

  it('renders an unpaid product order as a proforma and an issued one with its number', () => {
    const proforma = mapProductOrderToInvoiceDocument(product({ invoiceId: undefined }), franchise, address, address);
    expect(proforma.header.title).toBe(PROFORMA_TITLE);
    expect(proforma.header.invoiceNumber).toBe('');

    const issued = mapProductOrderToInvoiceDocument(
      product({ invoiceId: 'MEMUM/EXP/2026-27/P/000001', invoiceDate: '2026-10-12' }),
      franchise,
      address,
      address,
    );
    expect(issued.header.title).toBe('INVOICE');
    expect(issued.header.invoiceNumber).toBe('MEMUM/EXP/2026-27/P/000001');
    expect(issued.header.invoiceDate).toBe('2026-10-12');
  });

  describe('Indian GST particulars (roadmap 4.6 group 7)', () => {
    const indianSeller = { countryCode: 'IN', country: 'India', state: 'Maharashtra', stateCode: '27' } as unknown as IAddress;
    const indianBuyer = { countryCode: 'IN', country: 'India', state: 'Karnataka', stateCode: '29' } as unknown as IAddress;
    const usBuyer = { countryCode: 'US', country: 'United States', state: 'New York', stateCode: 'US-NY' } as unknown as IAddress;
    const issued = { invoiceId: 'EFMUM/2026-27/S/000010', invoiceDate: '2026-10-12' };

    it('domestic: place of supply is the buyer state with its code, seller GSTIN printed', () => {
      const doc = mapPaymentToInvoiceDocument(payment({ ...issued, taxObj: { IGST: { amount: 180, taxPercentage: 18 } } }), franchise, indianBuyer, indianSeller, []);
      expect(doc.header.placeOfSupply).toBe('Karnataka (29)');
      expect(doc.header.countryOfDestination).toBeUndefined();
      expect(doc.seller).toMatchObject({ taxId: '27CSEPS5397E1Z8', taxIdLabel: 'GSTIN' });
    });

    it('export under LUT: TAX INVOICE, Rule 46 endorsement, LUT ARN, IGST 0 row, country of destination', () => {
      const doc = mapPaymentToInvoiceDocument(
        payment({
          ...issued,
          invoiceId: 'EFMUM/EXP/2026-27/S/000001',
          taxMode: TaxMode.EXPORT_OF_SERVICE,
          taxAmount: 0,
          totalAmount: 1000,
          taxObj: {},
          isLutApplied: true,
          lutArn: 'AD270326000001T',
          invoiceNote: 'SUPPLY MEANT FOR EXPORT UNDER BOND OR LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX',
          jurisdiction: { entityCountry: 'India', customerCountry: 'United States', placeOfSupply: 'United States' },
        }),
        franchise,
        usBuyer,
        indianSeller,
        [],
      );
      expect(doc.header.title).toBe('TAX INVOICE');
      expect(doc.header).toMatchObject({ placeOfSupply: 'United States', countryOfDestination: 'United States' });
      expect(doc.tax).toMatchObject({ lutArn: 'AD270326000001T', rows: [{ label: 'IGST', amount: 0, percentage: 0 }] });
      expect(doc.tax.note).toContain('LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX');
    });

    it('export without a LUT: the IGST charged is shown and no ARN', () => {
      const doc = mapPaymentToInvoiceDocument(
        payment({
          ...issued,
          taxMode: TaxMode.EXPORT_OF_SERVICE,
          taxObj: { IGST: { amount: 180, taxPercentage: 18 } },
          isLutApplied: false,
          invoiceNote: 'SUPPLY MEANT FOR EXPORT ON PAYMENT OF INTEGRATED TAX',
        }),
        franchise,
        usBuyer,
        indianSeller,
        [],
      );
      expect(doc.tax.rows).toEqual([{ label: 'IGST', amount: 180, percentage: 18 }]);
      expect(doc.tax.lutArn).toBeUndefined();
    });

    it('foreign client taxed IGST (not an export): place of supply is their country, no destination line', () => {
      const doc = mapPaymentToInvoiceDocument(
        payment({
          ...issued,
          taxObj: { IGST: { amount: 180, taxPercentage: 18 } },
          jurisdiction: { entityCountry: 'India', customerCountry: 'United States', placeOfSupply: 'United States' },
        }),
        franchise,
        usBuyer,
        indianSeller,
        [],
      );
      expect(doc.header.placeOfSupply).toBe('United States');
      expect(doc.header.countryOfDestination).toBeUndefined();
    });

    it('supplier tax ID: TRN for a UAE franchise, none for an unregistered one', () => {
      const uaeSeller = { countryCode: 'AE', country: 'United Arab Emirates' } as unknown as IAddress;
      const uae = { companyName: 'Healuxe', gstNumber: '27CSEPS5397E1Z8', vatNumber: '100000000000003' } as unknown as IFranchise;
      const vatDoc = mapPaymentToInvoiceDocument(
        payment({ ...issued, taxType: TaxTypeEnum.VAT, taxMode: TaxMode.VAT, taxAmount: 0, taxObj: { VAT: { amount: 0, taxPercentage: 0 } } }),
        uae,
        usBuyer,
        uaeSeller,
        [],
      );
      expect(vatDoc.seller).toMatchObject({ taxId: '100000000000003', taxIdLabel: 'TRN' });
      const unregistered = { companyName: 'Mahi', gstNumber: null, vatNumber: null } as unknown as IFranchise;
      const noneDoc = mapPaymentToInvoiceDocument(
        payment({ ...issued, taxType: TaxTypeEnum.NONE, taxMode: TaxMode.NO_TAX, taxAmount: 0, taxObj: {} }),
        unregistered,
        indianBuyer,
        indianSeller,
        [],
      );
      expect(noneDoc.seller.taxId).toBeUndefined();
    });
  });

  describe('UAE VAT invoices (roadmap 4.6 group 8)', () => {
    const uaeSeller = { countryCode: 'AE', country: 'United Arab Emirates' } as unknown as IAddress;
    const uaeBuyer = { countryCode: 'AE', country: 'United Arab Emirates', state: 'Dubai' } as unknown as IAddress;
    const healuxe = { companyName: 'Healuxe Consulting FZE', vatNumber: '100000000000003' } as unknown as IFranchise;
    const vatPayment = (overrides: Partial<IMemberPayment>) =>
      payment({
        invoiceId: 'HCUAE/2026/S/000004',
        invoiceDate: '2026-10-12',
        currency: 'AED',
        taxType: TaxTypeEnum.VAT,
        taxMode: TaxMode.VAT,
        ...overrides,
      });

    it('0% zero-rated: TAX INVOICE with the TRN and a VAT (Z) line', () => {
      const doc = mapPaymentToInvoiceDocument(
        vatPayment({ taxAmount: 0, totalAmount: 1000, taxObj: { VAT: { amount: 0, taxPercentage: 0 } }, taxCategory: 'ZERO_RATED' as never }),
        healuxe,
        uaeBuyer,
        uaeSeller,
        [],
      );
      expect(doc.header.title).toBe('TAX INVOICE');
      expect(doc.seller).toMatchObject({ taxId: '100000000000003', taxIdLabel: 'TRN' });
      expect(doc.tax.rows).toEqual([{ label: 'VAT (Z)', amount: 0, percentage: 0 }]);
      expect(doc.header.placeOfSupply).toBeUndefined();
    });

    it('5% standard: a VAT (S) line', () => {
      const doc = mapPaymentToInvoiceDocument(
        vatPayment({ taxAmount: 50, totalAmount: 1050, taxObj: { VAT: { amount: 50, taxPercentage: 5 } }, taxCategory: 'STANDARD' as never }),
        healuxe,
        uaeBuyer,
        uaeSeller,
        [],
      );
      expect(doc.tax.rows).toEqual([{ label: 'VAT (S)', amount: 50, percentage: 5 }]);
    });

    it('foreign client: zero-rated with the evidence note', () => {
      const doc = mapPaymentToInvoiceDocument(
        vatPayment({
          currency: 'USD',
          taxAmount: 0,
          totalAmount: 1000,
          taxObj: { VAT: { amount: 0, taxPercentage: 0 } },
          taxCategory: 'ZERO_RATED' as never,
          invoiceNote: 'Zero-rated supply of services to a recipient outside the UAE.',
        }),
        healuxe,
        uaeBuyer,
        uaeSeller,
        [],
      );
      expect(doc.tax.note).toBe('Zero-rated supply of services to a recipient outside the UAE.');
    });

    it('unregistered (NONE rule): plain INVOICE, no tax line, no TRN', () => {
      const unregistered = { companyName: 'Healuxe Consulting FZE', vatNumber: null } as unknown as IFranchise;
      const doc = mapPaymentToInvoiceDocument(
        vatPayment({ taxType: TaxTypeEnum.NONE, taxMode: TaxMode.NO_TAX, taxAmount: 0, taxObj: {} }),
        unregistered,
        uaeBuyer,
        uaeSeller,
        [],
      );
      expect(doc.header.title).toBe('INVOICE');
      expect(doc.tax.rows).toEqual([]);
      expect(doc.seller.taxId).toBeUndefined();
    });

    it('amount in words uses the invoice currency', () => {
      const pdf = new InvoicePdfService();
      const words = (amount: number, currency: string): string =>
        (pdf as unknown as { getAmountInWords: (a: number, c: string) => string }).getAmountInWords(amount, currency);
      expect(words(1050.5, 'AED')).toBe('Dirhams One Thousand Fifty and Fifty Fils Only');
      expect(words(2500000, 'USD')).toBe('Dollars Two Million Five Hundred Thousand Only');
      expect(words(150000, 'INR')).toContain('Rupees One Lakh Fifty Thousand');
    });
  });

  it('A16 a foreign-currency invoice carries its functional-currency equivalents; FX pending shows none', () => {
    const withFx = mapPaymentToInvoiceDocument(
      payment({
        invoiceId: 'EFMUM/EXP/2026-27/S/000003',
        currency: 'USD',
        totalAmount: 100,
        taxAmount: 0,
        fxRate: 95.9927,
        fxRateDate: '2026-10-01',
        fxSource: 'FBIL',
        functionalCurrency: 'INR',
        functionalTotalAmount: 9599.27,
        functionalTaxAmount: 0,
      }),
      franchise,
      address,
      address,
      [],
    );
    expect(withFx.fx).toEqual({
      rate: 95.9927,
      rateDate: '2026-10-01',
      source: 'FBIL',
      fromCurrency: 'USD',
      currency: 'INR',
      totalAmount: 9599.27,
      taxAmount: 0,
    });
    const pending = mapPaymentToInvoiceDocument(
      payment({ invoiceId: 'EFMUM/EXP/2026-27/S/000004', currency: 'USD', functionalCurrency: 'INR', fxRate: null }),
      franchise,
      address,
      address,
      [],
    );
    expect(pending.fx).toBeUndefined();
  });
});
