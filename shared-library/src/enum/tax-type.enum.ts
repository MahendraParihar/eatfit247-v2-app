export enum TaxTypeEnum {
  GST = 'GST',
  VAT = 'VAT',
  SALES_TAX = 'SALES_TAX',
  NONE = 'NONE',
}

export enum InternationalTaxModeEnum {
  EXPORT_OF_SERVICE = 'EXPORT_OF_SERVICE',
  LOCAL_FOREIGN_TAX = 'LOCAL_FOREIGN_TAX',
}

export enum TransactionType {
  SERVICE = 'SERVICE',
  PRODUCT = 'PRODUCT',
}

/** Invoice number series. EXPORT is used only by Indian franchises. */
export enum InvoiceSeriesEnum {
  DOMESTIC = 'DOMESTIC',
  EXPORT = 'EXPORT',
}

export enum TaxMode {
  DOMESTIC_GST = 'DOMESTIC_GST', // India → India (GST)
  EXPORT_OF_SERVICE = 'EXPORT_OF_SERVICE', // India → Outside India (LUT 0%, or IGST paid without a valid LUT)
  EXPORT_OF_GOODS = 'EXPORT_OF_GOODS', // India → delivered outside India (LUT 0%, or IGST paid)
  VAT = 'VAT', // UAE / VAT countries
  RCM_IMPORT_SERVICE = 'RCM_IMPORT_SERVICE', // UAE → India (Reverse Charge)
  SALES_TAX = 'SALES_TAX', // USA
  NO_TAX = 'NO_TAX', // USA / Others
}

/** Export tax modes: their invoices go in the EXPORT series (roadmap 4.7). */
export const EXPORT_TAX_MODES: ReadonlyArray<TaxMode> = [TaxMode.EXPORT_OF_SERVICE, TaxMode.EXPORT_OF_GOODS];

/** VAT category of a supply (UAE S / Z / E / O), set on the tax rule and stored with the payment. */
export enum TaxCategoryEnum {
  STANDARD = 'STANDARD',
  ZERO_RATED = 'ZERO_RATED',
  EXEMPT = 'EXEMPT',
  OUT_OF_SCOPE = 'OUT_OF_SCOPE',
}

/**
 * How the money arrived. For a service export by an Indian franchise the money must be foreign
 * (IGST Act s.2(6)(iv)): every route except DOMESTIC qualifies. DOMESTIC covers UPI, Indian cards,
 * Indian net banking and NRO accounts.
 */
export enum PaymentRouteEnum {
  DOMESTIC = 'DOMESTIC',
  INTERNATIONAL_CARD_GATEWAY = 'INTERNATIONAL_CARD_GATEWAY',
  FOREIGN_REMITTANCE = 'FOREIGN_REMITTANCE',
  RUPEE_VOSTRO = 'RUPEE_VOSTRO',
  NRE_FCNR_ACCOUNT = 'NRE_FCNR_ACCOUNT',
}
