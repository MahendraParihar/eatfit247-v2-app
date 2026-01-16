import { IInvoiceDocument, IInvoiceItem, IInvoiceTaxRow } from './invoice-document.interface';
import { TaxMode, TaxTypeEnum, InvoiceItemType, TransactionType } from '../../enum/tax-type.enum';
import { IMemberPayment, IMemberPaymentObject } from '../member-payment.interface';
import { IFranchise } from '../franchise.interface';
import { IAddress } from '../location.interface';

/**
 * Optional member information for buyer details
 */
export interface IMemberInfo {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  emailId?: string;
  contactNumber?: string;
}

/**
 * SAC Code for Diet Consultancy Services (GST)
 * Standard SAC code for nutrition/diet consultation services
 */
const SAC_CODE_DIET_CONSULTANCY = '998314';
/**
 * Default HSN Code for Products (can be overridden per product)
 */
const DEFAULT_HSN_CODE = '30049099'; // Example: Other medicaments
/**
 * Maps payment entity to InvoiceDocument
 *
 * IMPORTANT: Does NOT calculate tax - uses stored taxSnapshot from paymentObj
 *
 * @param payment - Member payment entity with paymentObj containing tax snapshot
 * @param franchise - Franchise entity for seller information
 * @param memberAddress - Member address for buyer information
 * @param transactionType - SERVICE or PRODUCT (defaults to SERVICE)
 * @param itemDescription - Description for the invoice line item
 * @param franchiseAddress - Franchise address
 * @param memberInfo
 * @returns InvoiceDocument ready for PDF/UI rendering
 */
export function mapPaymentToInvoiceDocument(
  payment: IMemberPayment,
  franchise: IFranchise,
  memberAddress: IAddress,
  transactionType: TransactionType = TransactionType.SERVICE,
  franchiseAddress: IAddress,
  itemDescription?: string,
  memberInfo?: IMemberInfo,
): IInvoiceDocument {
  const paymentObj: IMemberPaymentObject = payment.paymentObj;
  const tax = paymentObj.tax;
  const pricing = paymentObj.pricing;
  const jurisdiction = paymentObj.jurisdiction;
  // Determine tax type and mode
  const taxType = tax.taxType as TaxTypeEnum;
  const taxMode = tax.taxMode as TaxMode;
  // Build tax rows from taxObj
  const taxRows: IInvoiceTaxRow[] = buildTaxRows(tax.taxObj, taxType, taxMode);
  // Determine if QR code should be enabled
  const qrCodeEnabled = taxType === TaxTypeEnum.GST && taxMode === TaxMode.DOMESTIC_GST;
  // Build QR code value if enabled
  let qrCodeValue = '';
  if (qrCodeEnabled && franchise.gstNumber) {
    qrCodeValue = buildQrCodeValue(
      franchise.gstNumber,
      payment.invoiceId || '',
      payment.paymentDate.toString(),
      pricing.totalAmount,
      tax.taxAmount,
    );
  }
  // Determine item type
  const itemType: InvoiceItemType =
    transactionType === TransactionType.PRODUCT ? InvoiceItemType.PRODUCT : InvoiceItemType.SERVICE;
  // Build invoice items
  const items: IInvoiceItem[] = [
    {
      type: itemType,
      description: itemDescription || `${payment.program} - ${payment.programPlan}`,
      sacCode: itemType === InvoiceItemType.SERVICE && taxType === TaxTypeEnum.GST ? SAC_CODE_DIET_CONSULTANCY : undefined,
      hsnCode: itemType === InvoiceItemType.PRODUCT && taxType === TaxTypeEnum.GST ? DEFAULT_HSN_CODE : undefined,
      qty: 1,
      rate: pricing.orderAmount,
      amount: pricing.orderAmount,
    },
  ];
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
  const taxNote = buildTaxNote(taxMode, paymentObj.invoice.note);
  return {
    header: {
      title: taxType === TaxTypeEnum.GST ? 'TAX INVOICE' : 'INVOICE',
      invoiceNumber: payment.invoiceId || `INV-${payment.memberPaymentId}`,
      invoiceDate: payment.paymentDate.toString(),
      currency: paymentObj.currency,
    },
    seller,
    buyer,
    items,
    pricing: {
      subtotal: pricing.orderAmount,
      discount: pricing.discountAmount,
      netAmount: pricing.orderAmount - pricing.discountAmount,
    },
    tax: {
      taxType,
      taxMode,
      rows: taxRows,
      totalTax: tax.taxAmount,
      note: taxNote,
    },
    total: {
      label: 'Total Amount Payable',
      amount: pricing.totalAmount,
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
  };
}
/**
 * Builds tax rows from taxObj
 */
function buildTaxRows(
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
 * Builds QR code value for Indian GST invoices
 * Format: JSON string with required fields
 */
function buildQrCodeValue(
  gstin: string,
  invoiceNumber: string,
  invoiceDate: string,
  totalAmount: number,
  taxAmount: number,
): string {
  const qrData = {
    gstin,
    invoiceNumber,
    invoiceDate,
    totalAmount: totalAmount.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
  };
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
  return {
    name: franchise.companyName || `${franchise.firstName} ${franchise.lastName}`,
    address,
    country: franchiseAddress.country || '',
    taxId,
    taxIdLabel,
    phone: franchise.contactNumber,
    email: franchise.emailId,
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

