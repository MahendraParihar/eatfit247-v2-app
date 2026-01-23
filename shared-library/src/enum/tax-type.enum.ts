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

export enum TaxMode {
  DOMESTIC_GST = 'DOMESTIC_GST', // India → India (GST)
  EXPORT_OF_SERVICE = 'EXPORT_OF_SERVICE', // India → Outside India (LUT)
  VAT = 'VAT', // UAE / VAT countries
  RCM_IMPORT_SERVICE = 'RCM_IMPORT_SERVICE', // UAE → India (Reverse Charge)
  SALES_TAX = 'SALES_TAX', // USA
  NO_TAX = 'NO_TAX', // USA / Others
}

export enum InvoiceItemType {
  SERVICE = 'SERVICE',
  PRODUCT = 'PRODUCT',
}
