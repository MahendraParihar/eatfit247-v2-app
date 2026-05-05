import { IInvoiceDocument, IInvoiceItem, IInvoiceTaxRow } from './invoice-document.interface';
import { TaxMode, TaxTypeEnum, TransactionType } from '../../enum';
import { IFranchise } from '../franchise.interface';
import { IAddress } from '../location.interface';
import {IMemberPayment, IMemberProduct} from "../member";

/**
 * Optional member information for buyer details
 */
export interface IMemberInfo {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  emailId?: string;
  contactNumber?: string;
  businessRegNumber?: string;
}

/**
 * Maps payment entity to InvoiceDocument
 *
 * IMPORTANT: Does NOT calculate tax - uses stored tax information from payment
 *
 * @param payment - Member payment entity with tax information
 * @param franchise - Franchise entity for seller information
 * @param memberAddress - Member address for buyer information
 * @param franchiseAddress - Franchise address
 * @param items
 * @param memberInfo
 * @param conditions
 * @returns InvoiceDocument ready for PDF/UI rendering
 */
export function mapPaymentToInvoiceDocument(
  payment: IMemberPayment,
  franchise: IFranchise,
  memberAddress: IAddress,
  franchiseAddress: IAddress,
  items: IInvoiceItem[],
  memberInfo?: IMemberInfo,
  conditions: string[] = [],
): IInvoiceDocument {
  // Determine tax type and mode
  const taxType = payment.taxType as TaxTypeEnum;
  const taxMode = payment.taxMode as TaxMode;
  // Build tax rows from taxObj
  const taxRows: IInvoiceTaxRow[] = buildTaxRows(
    payment.taxObj || {},
    taxType,
    taxMode,
  );
  // Determine if QR code should be enabled
  const qrCodeEnabled = taxType === TaxTypeEnum.GST && taxMode === TaxMode.DOMESTIC_GST;
  // Build QR code value if enabled
  let qrCodeValue = '';
  if (qrCodeEnabled && franchise.gstNumber) {
    const taxableAmount = payment.orderAmount;
    qrCodeValue = buildQrCodeValue(
      franchise.gstNumber,
      payment.invoiceId || '',
      payment.paymentDate.toString(),
      payment.totalAmount,
      payment.taxAmount,
      taxableAmount,
      payment.gstNumber,
      items.length,
      payment.taxObj,
    );
  }
  // Build seller (franchise) information
  const seller = buildSellerInfo(franchise, taxType, franchiseAddress);
  // Build buyer (member) information
  const buyer = buildBuyerInfo(
    memberAddress,
    payment.gstNumber,
    taxType,
    memberInfo || {
      fullName: payment.memberName,
    },
  );
  // Build tax note
  const taxNote = buildTaxNote(taxMode, payment.invoiceNote);
  return {
    header: {
      brandName: franchise.companyName,
      title: taxType === TaxTypeEnum.GST ? 'TAX INVOICE' : 'INVOICE',
      invoiceNumber: payment.invoiceId || `INV-${payment.memberPaymentId}`,
      invoiceDate: payment.paymentDate.toString(),
      currency: payment.currency,
    },
    seller,
    buyer,
    items,
    pricing: {
      subtotal: payment.orderAmount,
      discount: payment.discountAmount,
      taxableAmount: payment.orderAmount - (payment.discountAmount || 0),
      taxAmount: payment.taxAmount,
      totalAmount: payment.totalAmount,
    },
    tax: {
      taxType,
      taxMode,
      rows: taxRows,
      totalTax: payment.taxAmount,
      note: taxNote,
    },
    total: {
      label: 'Total Amount Payable',
      amount: payment.totalAmount,
    },
    payment: {
      methods: [payment.paymentMode || 'Online Payment'],
      status: payment.paymentStatus,
    },
    qrCode: qrCodeEnabled
      ? {
          enabled: true,
          value: qrCodeValue,
          label: 'Scan QR Code for Invoice Verification',
        }
      : undefined,
    footer: {
      legalNote: 'This is a computer-generated invoice and is valid without signature.',
    },
    termsAndConditions: conditions,
    currencyCode: payment.currency,
  };
}

/**
 * Builds tax rows from taxObj
 */
export function buildTaxRows(
  taxObj: Record<string, { amount: number; taxPercentage: number }>,
  taxType: TaxTypeEnum,
  taxMode: TaxMode,
): IInvoiceTaxRow[] {
  if (taxMode === TaxMode.NO_TAX || taxMode === TaxMode.RCM_IMPORT_SERVICE) {
    return [];
  }
  if (taxMode === TaxMode.EXPORT_OF_SERVICE) {
    return [
      {
        label: 'GST',
        amount: 0,
        percentage: 0,
      },
    ];
  }
  const rows: IInvoiceTaxRow[] = [];
  // For GST (DOMESTIC_GST)
  if (taxType === TaxTypeEnum.GST && taxMode === TaxMode.DOMESTIC_GST) {
    if (taxObj['CGST']) {
      rows.push({
        label: 'CGST',
        amount: taxObj['CGST'].amount,
        percentage: taxObj['CGST'].taxPercentage,
      });
    }
    if (taxObj['SGST']) {
      rows.push({
        label: 'SGST',
        amount: taxObj['SGST'].amount,
        percentage: taxObj['SGST'].taxPercentage,
      });
    }
    if (taxObj['IGST']) {
      rows.push({
        label: 'IGST',
        amount: taxObj['IGST'].amount,
        percentage: taxObj['IGST'].taxPercentage,
      });
    }
  }
  // For VAT
  if (taxType === TaxTypeEnum.VAT && taxMode === TaxMode.VAT) {
    if (taxObj['VAT']) {
      rows.push({
        label: 'VAT',
        amount: taxObj['VAT'].amount,
        percentage: taxObj['VAT'].taxPercentage,
      });
    }
  }
  // For US Sales Tax
  if (taxType === TaxTypeEnum.SALES_TAX) {
    if (taxObj['SALES_TAX']) {
      rows.push({
        label: 'Sales Tax',
        amount: taxObj['SALES_TAX'].amount,
        percentage: taxObj['SALES_TAX'].taxPercentage,
      });
    }
  }
  return rows;
}

/**
 * Builds QR code value for Indian GST invoices.
 *
 * Encodes the fields recommended by CBIC for dynamic QR on B2C invoices
 * (Notification 14/2020 – Central Tax) and useful context for B2B:
 *   - Supplier GSTIN, Buyer GSTIN (if B2B)
 *   - Invoice number & date
 *   - Total value, taxable value, tax amount
 *   - Number of items, HSN summary
 *   - Tax breakdown (CGST/SGST or IGST)
 */
function buildQrCodeValue(
  supplierGstin: string,
  invoiceNumber: string,
  invoiceDate: string,
  totalAmount: number,
  taxAmount: number,
  taxableAmount?: number,
  buyerGstin?: string,
  itemCount?: number,
  taxBreakdown?: Record<string, { amount: number; taxPercentage: number }>,
): string {
  const qrData: Record<string, unknown> = {
    sellerGstin: supplierGstin,
    invoiceNumber,
    invoiceDate,
    totalValue: totalAmount.toFixed(2),
    taxableValue: (taxableAmount ?? totalAmount - taxAmount).toFixed(2),
    taxAmount: taxAmount.toFixed(2),
  };

  if (buyerGstin) {
    qrData['buyerGstin'] = buyerGstin;
  }

  if (itemCount !== undefined && itemCount > 0) {
    qrData['itemCount'] = itemCount;
  }

  // Add tax component breakdown
  if (taxBreakdown) {
    if (taxBreakdown['CGST'] && taxBreakdown['SGST']) {
      qrData['cgstAmount'] = taxBreakdown['CGST'].amount.toFixed(2);
      qrData['sgstAmount'] = taxBreakdown['SGST'].amount.toFixed(2);
    }
    if (taxBreakdown['IGST']) {
      qrData['igstAmount'] = taxBreakdown['IGST'].amount.toFixed(2);
    }
  }

  return JSON.stringify(qrData);
}

/**
 * Builds seller (franchise) information
 */
function buildSellerInfo(
  franchise: IFranchise,
  taxType: TaxTypeEnum,
  franchiseAddress: IAddress,
): IInvoiceDocument['seller'] {
  // Determine tax ID and label based on a tax type
  let taxId: string | undefined;
  let taxIdLabel: string | undefined;
  if (taxType === TaxTypeEnum.GST) {
    taxId = franchise.gstNumber;
    taxIdLabel = 'GSTIN';
  } else if (taxType === TaxTypeEnum.VAT) {
    taxId = franchise.vatNumber;
    taxIdLabel = 'VAT No.';
  }
  // Use franchise address if provided, otherwise use placeholders
  // Note: IAddress has state and country as strings (from relationships)
  const address = {
    line1: franchiseAddress.postalAddress || '',
    line2: franchiseAddress.addressName,
    city: franchiseAddress.cityVillage || '',
    state: franchiseAddress.state || '',
    postalCode: franchiseAddress.pinCode || '',
    country: franchiseAddress.country || '',
  };
  // Get logo URL from franchise logo array if available
  let logoUrl: string | undefined;
  if (franchise.logo && Array.isArray(franchise.logo) && franchise.logo.length > 0) {
    logoUrl = franchise.logo[0].webUrl;
  }
  return {
    name: franchise.companyName || `${franchise.firstName} ${franchise.lastName}`,
    address,
    country: franchiseAddress.country || '',
    taxId,
    taxIdLabel,
    phone: franchise.contactNumber,
    email: franchise.emailId,
    logo: logoUrl,
  };
}

/**
 * Builds buyer (member) information
 */
function buildBuyerInfo(
  address: IAddress,
  gstNumber?: string,
  taxType?: TaxTypeEnum,
  memberInfo?: IMemberInfo,
): IInvoiceDocument['buyer'] {
  let taxId: string | undefined;
  let taxIdLabel: string | undefined;
  if (taxType === TaxTypeEnum.GST && gstNumber) {
    taxId = gstNumber;
    taxIdLabel = 'GSTIN';
  }
  // Build a member name from memberInfo or use placeholder
  const memberName =
    memberInfo?.fullName ||
    (memberInfo?.firstName || memberInfo?.lastName
      ? `${memberInfo.firstName || ''} ${memberInfo.lastName || ''}`.trim()
      : 'Customer');
  return {
    name: memberName,
    address: {
      line1: address.postalAddress || '',
      line2: address.addressName,
      city: address.cityVillage || '',
      state: address.state || '',
      postalCode: address.pinCode || '',
      country: address.country || '',
    },
    country: address.country,
    taxId,
    taxIdLabel,
    phone: memberInfo?.contactNumber,
    email: memberInfo?.emailId,
  };
}

/**
 * Builds tax note based on tax mode
 */
function buildTaxNote(taxMode: TaxMode, existingNote?: string): string | undefined {
  if (existingNote) {
    return existingNote;
  }
  switch (taxMode) {
    case TaxMode.EXPORT_OF_SERVICE:
      return 'Supply meant for export under LUT without payment of IGST';
    case TaxMode.RCM_IMPORT_SERVICE:
      return 'Tax payable by recipient under Reverse Charge Mechanism (RCM)';
    case TaxMode.NO_TAX:
      return 'No Tax Applicable';
    default:
      return undefined;
  }
}

function buildInvoiceOrderItem(productOrder: IMemberProduct): IInvoiceItem[] {
  return productOrder.orderItems.map((orderItem) => {
    const taxRows = buildTaxRows(orderItem.taxObj || {}, orderItem.taxType, orderItem.taxMode);
    return {
      type: TransactionType.PRODUCT,
      description: `${orderItem.productName} ${orderItem.quantityLabel}`,
      hsnCode: orderItem.taxType === TaxTypeEnum.GST ? orderItem.hsnCode : undefined,
      qty: orderItem.quantity,
      unitPrice: orderItem.unitPrice,
      amount: orderItem.baseAmount,
      discount: orderItem.discountAmount,
      taxPercentage: orderItem.effectiveTaxRate,
      taxAmount: orderItem.taxAmount,
      totalAmount: orderItem.totalAmount,
      taxType: orderItem.taxType,
      taxMode: orderItem.taxMode,
      taxRows: taxRows,
    } as IInvoiceItem;
  });
}

/**
 * Maps product order entity to InvoiceDocument with itemized products
 *
 * @param productOrder - Product order entity with order items
 * @param franchise - Franchise entity for seller information
 * @param memberAddress - Member address for buyer information
 * @param franchiseAddress - Franchise address
 * @param memberInfo - Member contact information
 * @param conditions
 * @returns InvoiceDocument ready for PDF/UI rendering
 */
export function mapProductOrderToInvoiceDocument(
  productOrder: IMemberProduct,
  franchise: IFranchise,
  memberAddress: IAddress,
  franchiseAddress: IAddress,
  memberInfo?: IMemberInfo,
  conditions: string[] = [],
): IInvoiceDocument {
  const items = buildInvoiceOrderItem(productOrder);

  // Determine if QR code should be enabled
  const qrCodeEnabled = productOrder.orderItems[0].taxType === TaxTypeEnum.GST && productOrder.orderItems[0].taxMode === TaxMode.DOMESTIC_GST;
  // Build QR code value if enabled
  let qrCodeValue = '';
  if (qrCodeEnabled && franchise.gstNumber) {
    const taxableAmount = productOrder.subTotalAmount;
    // Aggregate tax breakdown from first order item (same tax regime for all items in an order)
    const firstItemTaxObj = productOrder.orderItems[0].taxObj;
    qrCodeValue = buildQrCodeValue(
      franchise.gstNumber,
      productOrder.invoiceId || '',
      productOrder.paymentDate?.toString() || '',
      productOrder.totalAmount,
      productOrder.taxAmount,
      taxableAmount,
      productOrder.gstNumber,
      productOrder.orderItems.length,
      firstItemTaxObj,
    );
  }
  // Build seller (franchise) information
  const seller = buildSellerInfo(franchise, productOrder.orderItems[0].taxType, franchiseAddress);
  // Build buyer (member) information
  const buyer = buildBuyerInfo(
    memberAddress,
    productOrder.gstNumber,
    productOrder.orderItems[0].taxType,
    memberInfo || {
      fullName: productOrder.memberName,
    },
  );
  // Build tax note
  const taxNote = buildTaxNote(productOrder.orderItems[0].taxMode, productOrder.orderItems[0].invoiceNote);
  return {
    header: {
      brandName: franchise.companyName,
      title: productOrder.orderItems[0].taxType === TaxTypeEnum.GST ? 'TAX INVOICE' : 'INVOICE',
      invoiceNumber: productOrder.invoiceId || `INV-${productOrder.memberProductId}`,
      invoiceDate: productOrder.paymentDate?.toString() || new Date().toISOString(),
      currency: productOrder.currency,
    },
    seller,
    buyer,
    items,
    pricing: {
      subtotal: productOrder.subTotalAmount,
      discount: productOrder.discountAmount,
      taxableAmount: productOrder.subTotalAmount - (productOrder.discountAmount || 0),
      taxAmount: productOrder.taxAmount,
      totalAmount: productOrder.totalAmount,
    },
    tax: {
      taxType: productOrder.orderItems[0].taxType,
      taxMode: productOrder.orderItems[0].taxMode,
      rows: [],
      totalTax: productOrder.taxAmount,
      note: taxNote,
    },
    total: {
      label: 'Total Amount Payable',
      amount: productOrder.totalAmount,
    },
    payment: {
      methods: [productOrder.paymentMode || 'Online Payment'],
      status: productOrder.paymentStatus,
      transactionId: productOrder.transactionId,
    },
    qrCode: qrCodeEnabled
      ? {
        enabled: true,
        value: qrCodeValue,
        label: 'Scan QR Code for Invoice Verification',
      }
      : undefined,
    footer: {
      legalNote: 'This is a computer-generated invoice and is valid without signature.',
    },
    termsAndConditions: conditions,
    currencyCode: productOrder.currency,
  };
}

