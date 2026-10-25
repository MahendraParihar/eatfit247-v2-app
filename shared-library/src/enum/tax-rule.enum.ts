/**
 * Tax Master treatment rules (configurable tax treatment, decisions 3, 4, 9–11). The values are the
 * `mst_tax_master` / sale column values of migration 146.
 */

/** What a matched rule does with the sale. */
export enum TaxTreatmentEnum {
  /** Charge the rule's tax system at its rate (CGST+SGST or IGST by place of supply for GST) */
  CHARGE = 'CHARGE',
  /** VAT 0% zero-rated export (UAE ER Art 30 / 31) */
  ZERO_RATED_EXPORT = 'ZERO_RATED_EXPORT',
  /** Indian export: 0% under a valid LUT, else IGST at the rule rate (IGST s.16, Rule 96A) */
  EXPORT_LUT_OR_TAX = 'EXPORT_LUT_OR_TAX',
  /** Outside the supplier's tax (no tax, category O) */
  OUT_OF_SCOPE = 'OUT_OF_SCOPE',
  /** The sale is refused with the rule's message */
  REFUSE = 'REFUSE',
  /** Taxed and invoiced under the franchise's registration in the customer's country */
  FOREIGN_REGISTRATION = 'FOREIGN_REGISTRATION',
}

/** Where the customer is, relative to the supplier (place of supply). */
export enum CustomerScopeEnum {
  SAME_COUNTRY = 'SAME_COUNTRY',
  /** The country in `placeOfSupplyCountryCode` */
  SPECIFIC_COUNTRY = 'SPECIFIC_COUNTRY',
  ANY_FOREIGN = 'ANY_FOREIGN',
  ANY = 'ANY',
}

/** Customer's State relative to the supplier's (same-country rules only). An unknown State counts as OTHER. */
export enum StateRelationEnum {
  ANY = 'ANY',
  SAME = 'SAME',
  OTHER = 'OTHER',
}

/** Whether the supplier holds an active registration (`mst_franchise_tax_registrations`). */
export enum RegistrationConditionEnum {
  ANY = 'ANY',
  REGISTERED = 'REGISTERED',
  UNREGISTERED = 'UNREGISTERED',
}

/** B2B: the customer gave a valid GSTIN / TRN; B2C otherwise (decision 10). */
export enum CustomerTypeEnum {
  B2B = 'B2B',
  B2C = 'B2C',
}

export enum CustomerTypeConditionEnum {
  ANY = 'ANY',
  B2B = 'B2B',
  B2C = 'B2C',
}

/** `mst_program_plans.is_electronic_service` (UAE ER Art 23). Goods are never electronic services. */
export enum ElectronicConditionEnum {
  ANY = 'ANY',
  YES = 'YES',
  NO = 'NO',
}

/** How the money arrived: DOMESTIC = the DOMESTIC payment route, FOREIGN = any other route. Services only. */
export enum MoneyConditionEnum {
  ANY = 'ANY',
  DOMESTIC = 'DOMESTIC',
  FOREIGN = 'FOREIGN',
}

/** The money of one sale (the fact a MoneyConditionEnum rule is matched against). */
export enum MoneyOriginEnum {
  DOMESTIC = 'DOMESTIC',
  FOREIGN = 'FOREIGN',
}

/** A rule for every plan / product of the franchise, or for the one in `referenceId`. */
export enum RuleAppliesToEnum {
  ALL = 'ALL',
  SPECIFIC = 'SPECIFIC',
}

/** Zero-rating evidence of one sale (decision 9). */
export enum TaxEvidenceStatusEnum {
  /** Every available indicator points outside the supplier's country */
  OK = 'OK',
  /** At least one indicator points inside it: a finance decision is needed */
  MISMATCH = 'MISMATCH',
  /** Public checkout: no evidence collected (online payments deferred) */
  NOT_COLLECTED = 'NOT_COLLECTED',
}

/** One evidence indicator. NOT_AVAILABLE: no value, or a value that can't be read (e.g. an unknown dial code). */
export enum TaxEvidenceIndicatorResultEnum {
  CONSISTENT = 'CONSISTENT',
  MISMATCH = 'MISMATCH',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

/** Finance decision on an evidence mismatch (`TaxEvidence` Update). */
export enum TaxEvidenceDecisionEnum {
  /** Keep the zero-rated treatment, with a reason */
  KEEP = 'KEEP',
  /** Price with the rule's fallback */
  APPLY_FALLBACK = 'APPLY_FALLBACK',
}

/** Goods-export record on an export-mode order (decision 11; GSTR-1 Table 6A). */
export enum ExportDocumentTypeEnum {
  SHIPPING_BILL = 'SHIPPING_BILL',
  CSB_V = 'CSB_V',
  POSTAL_BILL = 'POSTAL_BILL',
}
