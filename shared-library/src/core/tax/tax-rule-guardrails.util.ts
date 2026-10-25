import {
  CustomerScopeEnum,
  MoneyConditionEnum,
  RegistrationConditionEnum,
  RuleAppliesToEnum,
  StateRelationEnum,
  TaxCategoryEnum,
  TaxTreatmentEnum,
  TaxTypeEnum,
  TransactionType,
} from '../../enum';
import { ITaxRule, ITaxRuleSaveWarning } from './tax-rule.interface';

/** A rule being saved: an existing row with its edits, or a new one (no id yet). */
export type ITaxRuleDraft = Omit<ITaxRule, 'id'> & { id?: number | null };

/** One refused save: a code and the message shown to the admin. */
export interface ITaxRuleBlock {
  code: string;
  message: string;
}

/** Treatments that only make sense for a sale abroad. */
const FOREIGN_TREATMENTS: ReadonlyArray<string> = [
  TaxTreatmentEnum.ZERO_RATED_EXPORT,
  TaxTreatmentEnum.EXPORT_LUT_OR_TAX,
  TaxTreatmentEnum.OUT_OF_SCOPE,
  TaxTreatmentEnum.FOREIGN_REGISTRATION,
];
const FOREIGN_SCOPES: ReadonlyArray<string> = [CustomerScopeEnum.ANY_FOREIGN, CustomerScopeEnum.SPECIFIC_COUNTRY];

const code = (value: string | null | undefined): string => (value ?? '').trim().toUpperCase();

/**
 * Save-time guardrails for Tax Master rules (configurable tax treatment, decision 7): hard blocks encode the
 * law that never changes (D6) and every database CHECK of migration 146, so a refused save is a 400 with a
 * reason, never a database error; warnings are the judgement calls the law leaves to the owner and adviser,
 * and saving with any of them needs a legal basis. Pure: the admin form shows the same messages inline.
 * Checks that need data (registrations, the fallback row, duplicates) run in the server's service.
 */
export class TaxRuleGuardrailsUtil {
  static blocks(rule: ITaxRuleDraft): ITaxRuleBlock[] {
    const blocks: ITaxRuleBlock[] = [];
    const block = (blockCode: string, message: string) => blocks.push({ code: blockCode, message });
    const supplier = code(rule.countryCode);
    const scope = rule.customerScope;
    const treatment = rule.treatment;
    const rate = Number(rule.taxPercent);
    const category = rule.taxCategory || TaxCategoryEnum.STANDARD;

    if ((rule.taxSystem === TaxTypeEnum.GST || treatment === TaxTreatmentEnum.EXPORT_LUT_OR_TAX) && supplier !== 'IN') {
      block('GST_OUTSIDE_INDIA', 'GST, the CGST / SGST split and the LUT are for an Indian supplier (country IN) only.');
    }
    if (treatment === TaxTreatmentEnum.EXPORT_LUT_OR_TAX && rule.taxSystem !== TaxTypeEnum.GST) {
      block('LUT_NEEDS_GST', 'Export under LUT or with IGST is a GST treatment: set the tax system to GST.');
    }
    if (FOREIGN_TREATMENTS.includes(treatment) && !FOREIGN_SCOPES.includes(scope)) {
      block('EXPORT_NEEDS_FOREIGN_SCOPE', 'Export, out-of-scope and foreign-registration treatments are for customers abroad: choose "any foreign country" or a specific country.');
    }
    if (treatment === TaxTreatmentEnum.ZERO_RATED_EXPORT && rule.taxSystem !== TaxTypeEnum.VAT) {
      block('ZERO_RATED_NEEDS_VAT', 'A zero-rated export is a VAT treatment; an Indian export uses "export under LUT or with IGST".');
    }
    if (rule.transactionType === TransactionType.PRODUCT && rule.moneyCondition !== MoneyConditionEnum.ANY) {
      block('MONEY_ON_GOODS', 'A goods rule cannot depend on how the money arrived: goods are exported when they leave the country.');
    }
    if (scope === CustomerScopeEnum.SPECIFIC_COUNTRY) {
      const place = code(rule.placeOfSupplyCountryCode);
      if (!place) {
        block('SPECIFIC_COUNTRY_MISSING', 'Choose the customer country for a "specific country" rule.');
      } else if (place === supplier) {
        block('SPECIFIC_COUNTRY_IS_SUPPLIER', 'The specific country is the supplier\'s own country: use "same country" instead.');
      }
    } else if (code(rule.placeOfSupplyCountryCode)) {
      block('COUNTRY_WITHOUT_SPECIFIC_SCOPE', 'A customer country is set only on a "specific country" rule.');
    }
    if (rule.stateRelation !== StateRelationEnum.ANY && scope !== CustomerScopeEnum.SAME_COUNTRY) {
      block('STATE_ON_FOREIGN_SCOPE', 'The State condition applies to customers in the supplier\'s own country only.');
    }
    if (rule.taxSystem === TaxTypeEnum.VAT && rule.registrationCondition === RegistrationConditionEnum.UNREGISTERED) {
      block('VAT_UNREGISTERED', 'Only a VAT-registered supplier charges VAT: a VAT rule cannot be for an unregistered franchise.');
    }
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      block('RATE_RANGE', 'The rate must be between 0 and 100.');
    }
    if (rule.taxSystem === TaxTypeEnum.VAT && rate === 0 && category === TaxCategoryEnum.STANDARD) {
      block('VAT_ZERO_STANDARD', 'A 0% VAT rule must be zero-rated or exempt (or out of scope).');
    }
    if (rule.taxSystem === TaxTypeEnum.VAT && rate > 0 && category !== TaxCategoryEnum.STANDARD) {
      block('VAT_RATE_NOT_STANDARD', `A ${rate}% VAT rule is standard-rated; zero-rated, exempt and out-of-scope rules are 0%.`);
    }
    if (treatment === TaxTreatmentEnum.REFUSE && !(rule.refusalMessage ?? '').trim()) {
      block('REFUSE_NEEDS_MESSAGE', 'A refusal needs the message the admin and the customer see.');
    }
    if (treatment === TaxTreatmentEnum.FOREIGN_REGISTRATION && scope !== CustomerScopeEnum.SPECIFIC_COUNTRY) {
      block('FOREIGN_REGISTRATION_NEEDS_COUNTRY', 'Invoicing under a registration abroad is for one specific country: choose it.');
    }
    if (rule.requiresEvidence && !rule.fallbackTaxMasterId) {
      block('EVIDENCE_NEEDS_FALLBACK', 'A rule that requires evidence must name the fallback rule used when the evidence does not hold.');
    }
    if (rule.requiresEvidence && rule.fallbackOnly) {
      block('FALLBACK_WITH_EVIDENCE', 'A fallback-only rule cannot itself require evidence.');
    }
    if (rule.id && rule.fallbackTaxMasterId && Number(rule.fallbackTaxMasterId) === Number(rule.id)) {
      block('FALLBACK_SELF', 'A rule cannot be its own fallback.');
    }
    if (rule.appliesTo === RuleAppliesToEnum.SPECIFIC && !(Number(rule.referenceId) > 0)) {
      block('SPECIFIC_NEEDS_REFERENCE', 'Choose the plan or product a "specific" rule applies to.');
    }
    return blocks;
  }

  /**
   * D7 fallback rules: the fallback must be an active fallback-only rule of the same franchise, supplier country
   * and transaction type, must not need evidence itself, and must cover every sale the rule covers (each of its
   * conditions "any" or the same; its scope the same, "any", or any foreign for a specific-country rule).
   */
  static fallbackBlocks(rule: ITaxRuleDraft, fallback: ITaxRuleDraft & { id: number }): ITaxRuleBlock[] {
    const blocks: ITaxRuleBlock[] = [];
    const block = (blockCode: string, message: string) => blocks.push({ code: blockCode, message: `Fallback rule ${fallback.id}: ${message}` });
    if (!fallback.fallbackOnly) {
      block('FALLBACK_NOT_FALLBACK_ONLY', 'only a fallback-only rule can be a fallback (it is never matched on its own).');
    }
    if (!fallback.active) {
      block('FALLBACK_INACTIVE', 'it is inactive.');
    }
    if (
      Number(fallback.franchiseId) !== Number(rule.franchiseId) ||
      code(fallback.countryCode) !== code(rule.countryCode) ||
      fallback.transactionType !== rule.transactionType
    ) {
      block('FALLBACK_OTHER_RULE_SET', 'it belongs to another franchise, supplier country or transaction type.');
    }
    if (fallback.requiresEvidence) {
      block('FALLBACK_NEEDS_EVIDENCE', 'it requires evidence itself.');
    }
    const day = (value: Date | string | null | undefined) => (value ? String(value instanceof Date ? value.toISOString() : value).slice(0, 10) : null);
    const fallbackFrom = day(fallback.effectiveFrom) ?? '';
    const fallbackTo = day(fallback.effectiveTo);
    const ruleTo = day(rule.effectiveTo);
    if (fallbackFrom > (day(rule.effectiveFrom) ?? '') || (fallbackTo !== null && (ruleTo === null || fallbackTo < ruleTo))) {
      block('FALLBACK_DATES', "its effective dates do not cover this rule's.");
    }
    const scopeCovers =
      fallback.customerScope === CustomerScopeEnum.ANY ||
      (fallback.customerScope === rule.customerScope && code(fallback.placeOfSupplyCountryCode) === code(rule.placeOfSupplyCountryCode)) ||
      (fallback.customerScope === CustomerScopeEnum.ANY_FOREIGN && rule.customerScope === CustomerScopeEnum.SPECIFIC_COUNTRY);
    const sameOrAny = (fallbackValue: string, ruleValue: string) => fallbackValue === 'ANY' || fallbackValue === ruleValue;
    const appliesCovers =
      fallback.appliesTo === RuleAppliesToEnum.ALL ||
      (rule.appliesTo === RuleAppliesToEnum.SPECIFIC && Number(fallback.referenceId) === Number(rule.referenceId));
    if (
      !scopeCovers ||
      !sameOrAny(fallback.stateRelation, rule.stateRelation) ||
      !sameOrAny(fallback.registrationCondition, rule.registrationCondition) ||
      !sameOrAny(fallback.customerTypeCondition, rule.customerTypeCondition) ||
      !sameOrAny(fallback.electronicCondition, rule.electronicCondition) ||
      !sameOrAny(fallback.moneyCondition, rule.moneyCondition) ||
      !appliesCovers
    ) {
      block('FALLBACK_NOT_EXECUTABLE', 'its conditions do not cover every sale this rule covers.');
    }
    return blocks;
  }

  /** Judgement calls (D7): saving with any of them needs a legal basis. `seeded`: the row was created by a migration. */
  static warnings(rule: ITaxRuleDraft, options: { seeded?: boolean } = {}): ITaxRuleSaveWarning[] {
    const warnings: ITaxRuleSaveWarning[] = [];
    const warn = (warningCode: string, message: string) => warnings.push({ code: warningCode, message });
    const foreign = FOREIGN_SCOPES.includes(rule.customerScope);
    if (rule.treatment === TaxTreatmentEnum.EXPORT_LUT_OR_TAX && rule.registrationCondition !== RegistrationConditionEnum.REGISTERED) {
      warn('LUT_NOT_LIMITED_TO_REGISTERED', 'Export under LUT applies to a GST-registered supplier; an unregistered franchise is refused anyway (IGST s.16, Rule 96A).');
    }
    // Any GST charge that can match a sale abroad paid in foreign money (scope ANY included; money not DOMESTIC)
    if (
      rule.treatment === TaxTreatmentEnum.CHARGE &&
      rule.taxSystem === TaxTypeEnum.GST &&
      (foreign || rule.customerScope === CustomerScopeEnum.ANY) &&
      rule.moneyCondition !== MoneyConditionEnum.DOMESTIC
    ) {
      warn('GST_ON_FOREIGN_MONEY_SALE', 'This charges IGST on a sale abroad paid in foreign money, which can qualify as an export (IGST s.2(6)).');
    }
    if (rule.treatment === TaxTreatmentEnum.ZERO_RATED_EXPORT || rule.treatment === TaxTreatmentEnum.OUT_OF_SCOPE) {
      warn('ZERO_RATED_OR_OUT_OF_SCOPE_EXPORT', 'No tax is charged on these sales: record the article that zero-rates them or puts them out of scope.');
    }
    if (
      rule.taxSystem === TaxTypeEnum.VAT &&
      rule.treatment === TaxTreatmentEnum.CHARGE &&
      Number(rule.taxPercent) === 0 &&
      !foreign
    ) {
      warn('ZERO_DOMESTIC_VAT', 'A 0% VAT rate on sales inside the country needs its basis (e.g. UAE ER Art 41 healthcare).');
    }
    if (rule.treatment === TaxTreatmentEnum.REFUSE) {
      warn('REFUSAL', 'Matching sales are refused: record the law that requires it.');
    }
    if (options.seeded) {
      warn('SEEDED_RULE_EDIT', 'This rule was seeded from the legal analysis (migrations 144 / 146): record why it changes.');
    }
    return warnings;
  }
}
