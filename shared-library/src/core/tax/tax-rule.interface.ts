import {
  CustomerScopeEnum,
  CustomerTypeConditionEnum,
  CustomerTypeEnum,
  ElectronicConditionEnum,
  MoneyConditionEnum,
  MoneyOriginEnum,
  PaymentRouteEnum,
  RegistrationConditionEnum,
  RuleAppliesToEnum,
  StateRelationEnum,
  TaxEvidenceDecisionEnum,
  TaxEvidenceIndicatorResultEnum,
  TaxEvidenceStatusEnum,
  TaxTreatmentEnum,
  TaxTypeEnum,
  TransactionType,
} from '../../enum';
import { ICalculateTaxResponse } from '../tax-calculation.interface';

/**
 * Conditions and treatment of a Tax Master rule (configurable tax treatment, decisions 3, 4, 7, 9).
 * Every condition defaults to "any", the scope to SAME_COUNTRY and the treatment to CHARGE.
 */
export interface ITaxRuleConditions {
  customerScope: CustomerScopeEnum | string;
  /** The country when `customerScope` is SPECIFIC_COUNTRY */
  placeOfSupplyCountryCode?: string | null;
  stateRelation: StateRelationEnum | string;
  registrationCondition: RegistrationConditionEnum | string;
  customerTypeCondition: CustomerTypeConditionEnum | string;
  electronicCondition: ElectronicConditionEnum | string;
  moneyCondition: MoneyConditionEnum | string;
  appliesTo: RuleAppliesToEnum | string;
}

export interface ITaxRuleTreatment {
  treatment: TaxTreatmentEnum | string;
  /** Shown when the treatment is REFUSE */
  refusalMessage?: string | null;
  /** Printed on the invoice (e.g. the Art 31 note); exports under GST use the Rule 46 endorsement instead */
  invoiceNote?: string | null;
  /** Zero-rating evidence policy: a mismatch needs a finance decision or the fallback */
  requiresEvidence: boolean;
  fallbackTaxMasterId?: number | null;
  /** Never matched directly; used only as another rule's fallback */
  fallbackOnly: boolean;
}

/** The fields the matcher reads (a Tax Master row, or a draft rule being saved). */
export interface ITaxRuleMatchable extends ITaxRuleConditions {
  id?: number | null;
  franchiseId: number;
  /** Supplier country of the rule */
  countryCode: string;
  transactionType: TransactionType | string;
  /** The plan / product when `appliesTo` is SPECIFIC; ignored for ALL */
  referenceId: number;
  /** `YYYY-MM-DD` (a Date is read as its UTC day) */
  effectiveFrom: Date | string;
  effectiveTo?: Date | string | null;
  active: boolean;
  fallbackOnly: boolean;
}

/**
 * The facts of one sale the rules are matched against. The place of supply is the billing address
 * for services, the delivery address for goods, and the GSTIN State for India B2B services
 * (see `TaxRuleMatchUtil.placeOfSupply`).
 */
export interface ITaxRuleFacts {
  franchiseId: number;
  supplierCountryCode: string;
  supplierStateCode?: string | null;
  transactionType: TransactionType | string;
  /** The plan or product sold */
  referenceId: number;
  placeOfSupplyCountryCode: string;
  placeOfSupplyStateCode?: string | null;
  /** The supplier holds an active registration on the supply date */
  registered: boolean;
  customerType: CustomerTypeEnum | string;
  /** The plan is an electronic service; always false for goods */
  electronic: boolean;
  /** Services: how the money arrived; null for goods (a goods rule never has a money condition) */
  money?: MoneyOriginEnum | string | null;
  /** `YYYY-MM-DD` in the franchise's time zone */
  supplyDate: string;
}

/** Inputs of the place-of-supply rule (decision 3; IGST s.10, s.12; UAE ER Art 30, 31). */
export interface IPlaceOfSupplyInput {
  transactionType: TransactionType | string;
  supplierCountryCode: string;
  billingCountryCode?: string | null;
  billingStateCode?: string | null;
  deliveryCountryCode?: string | null;
  deliveryStateCode?: string | null;
  /** A validated customer GSTIN / TRN (B2B); empty for B2C */
  customerRegistrationNumber?: string | null;
}

export interface IPlaceOfSupply {
  countryCode: string | null;
  stateCode: string | null;
  /** Which address decided it */
  source: 'BILLING' | 'DELIVERY' | 'GSTIN';
  /** India B2B services: the GSTIN State differs from the billing State (noted in the reason, decision 10) */
  stateDiffersFromBilling: boolean;
}

/** The rules that match a sale, best first (D4 precedence). */
export interface ITaxRuleResolution<T extends ITaxRuleMatchable = ITaxRuleMatchable> {
  winner: T | null;
  /** The other matching rules, in precedence order */
  runnersUp: T[];
  /** The winner ties with the next rule on all eight dimensions (a duplicate the save should have refused) */
  ambiguous: boolean;
}

/** A save-time warning (D7). Saving with warnings needs a legal basis. */
export interface ITaxRuleSaveWarning {
  code: string;
  message: string;
}

/** A Tax Master row with conditions and treatment. */
export interface ITaxRule extends ITaxRuleMatchable, ITaxRuleTreatment {
  id: number;
  taxSystem: TaxTypeEnum | string;
  taxCode: string;
  taxName: string;
  taxPercent: number;
  isTaxInclusive: boolean;
  taxCategory: string;
  hsnSacCode?: string | null;
  legalBasis?: string | null;
}

/** `POST tax-master/preview`: which rule would price a sale, without saving anything (decision 7). */
export interface ITaxRulePreviewRequest {
  franchiseId: number;
  transactionType: TransactionType;
  /** Plan or product */
  referenceId: number;
  billingCountryCode?: string | null;
  billingStateCode?: string | null;
  deliveryCountryCode?: string | null;
  deliveryStateCode?: string | null;
  customerRegistrationNumber?: string | null;
  paymentRoute?: PaymentRouteEnum | null;
  currency?: string | null;
  /** Defaults to today in the franchise's time zone */
  supplyDate?: string | null;
  /** Price this amount too (group 6) */
  amount?: number | null;
}

export interface ITaxRulePreviewResponse {
  facts: ITaxRuleFacts;
  winner: ITaxRule | null;
  runnersUp: ITaxRule[];
  /** E.g. a plan-specific rule shadowed by a rule that wins on an earlier dimension */
  warnings: ITaxRuleSaveWarning[];
  /** The computed tax for `amount` (from group 6) */
  tax?: ICalculateTaxResponse | null;
}

/** A tax registration of a franchise in one country (decision 8). No active row = unregistered. */
export interface ITaxRegistration {
  taxRegistrationId: number;
  franchiseId: number;
  countryCode: string;
  taxSystem: TaxTypeEnum | string;
  registrationNumber: string;
  /** GST: the registration's State (GSTIN digits 1–2) */
  stateCode?: string | null;
  /** Importer-Exporter Code (goods exports) */
  iecNumber?: string | null;
  currencyCode: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  /** A registration abroad: its own invoice series */
  invoicePrefix?: string | null;
  invoiceNumberFormat?: string | null;
  fyStartMonth?: number | null;
  active: boolean;
}

/**
 * `POST / PUT franchise-tax-registrations/:franchiseId`. The GST State comes from the GSTIN; the currency
 * defaults to the country's. A registration abroad's invoice series (prefix, format, FY start) is set with
 * group 11.
 */
export interface IManageTaxRegistration {
  countryCode: string;
  taxSystem: TaxTypeEnum | string;
  registrationNumber: string;
  iecNumber?: string | null;
  currencyCode?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  active?: boolean;
}

/** The registration an invoice is issued under; the PDF prints its number and label (decision 12). */
export interface IInvoiceRegistration {
  /** Null for a franchise with no registration (an unregistered invoice) */
  taxRegistrationId: number | null;
  countryCode: string;
  taxSystem: TaxTypeEnum | string;
  registrationNumber: string | null;
  /** "GSTIN", "TRN", … */
  label: string | null;
  stateCode?: string | null;
  currencyCode: string;
}

/** One evidence indicator with what it showed (decision 9). */
export interface ITaxEvidenceIndicator {
  /** The value checked (country code, dial code, true / false for the declaration) */
  value: string | boolean | null;
  /** ISO country the value points to, when it points to one */
  countryCode?: string | null;
  result: TaxEvidenceIndicatorResultEnum;
}

/** Finance decision on a mismatch, stored with who and when. */
export interface IEvidenceDecision {
  decision: TaxEvidenceDecisionEnum;
  /** Required for KEEP */
  reason?: string | null;
  decidedBy?: number | null;
  decidedAt?: string | null;
}

/** Zero-rating evidence of a sale (`tax_evidence` jsonb on payments and order headers). */
export interface ITaxEvidence {
  status: TaxEvidenceStatusEnum;
  /** The rule whose evidence policy was checked */
  taxMasterId?: number | null;
  indicators: {
    billingCountry: ITaxEvidenceIndicator;
    /** The client declared no residence in, and absence from, the supplier's country */
    declaration: ITaxEvidenceIndicator;
    dialCode: ITaxEvidenceIndicator;
    /** VAT evidence only */
    payerAccountCountry: ITaxEvidenceIndicator;
  };
  /** India: a DOMESTIC route with a foreign payer account (warning; the route decides the tax) */
  warnings?: string[];
  decision?: IEvidenceDecision | null;
  checkedAt?: string | null;
}
