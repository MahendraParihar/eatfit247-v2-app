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
});
