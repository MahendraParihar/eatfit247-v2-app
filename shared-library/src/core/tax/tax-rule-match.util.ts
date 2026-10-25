import {
  CustomerScopeEnum,
  CustomerTypeConditionEnum,
  ElectronicConditionEnum,
  MoneyConditionEnum,
  MoneyOriginEnum,
  PaymentRouteEnum,
  RegistrationConditionEnum,
  RuleAppliesToEnum,
  StateRelationEnum,
  TransactionType,
} from '../../enum';
import { IPlaceOfSupply, IPlaceOfSupplyInput, ITaxRuleFacts, ITaxRuleMatchable, ITaxRuleResolution, ITaxRuleSaveWarning } from './tax-rule.interface';
import { gstStateCode, TaxRegistrationNumberUtil } from './tax-registration-number.util';

const code = (value: string | null | undefined): string => (value ?? '').trim().toUpperCase();

/** `YYYY-MM-DD` of a DATEONLY value (a Date is read as its UTC day). */
const day = (value: Date | string | null | undefined): string | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
};

/** GST State codes compare as numbers (`7` = `07`); other codes as text. */
const sameState = (a: string | null | undefined, b: string | null | undefined): boolean => {
  const left = code(a);
  const right = code(b);
  if (!left || !right) {
    return false;
  }
  return /^\d+$/.test(left) && /^\d+$/.test(right) ? Number(left) === Number(right) : left === right;
};

/**
 * Rule matching and precedence for Tax Master treatment rules (configurable tax treatment, decisions 3 and 4).
 *
 * A rule matches a sale when it is active, not fallback-only, effective on the supply date, of the same
 * franchise, transaction type and supplier country, and every condition holds. Among matching rules the
 * first of these dimensions where two rules differ decides (D4):
 *   1. customer scope: a specific country > same country / any foreign > any
 *   2. State relation, 3. registration, 4. customer type, 5. electronic, 6. money: a set value > any
 *   7. applies to: a specific plan or product > all
 *   8. the later effective_from
 * Conditions come before "specific plan", so a refusal on a condition can't be bypassed by a plan rate.
 * Pure functions, shared by the server and the admin preview.
 */
export class TaxRuleMatchUtil {
  /**
   * Services: the billing address; goods: the delivery address; India B2B services with an Indian billing
   * address: the GSTIN's State (decision 10). A GSTIN never turns a foreign billing address into India.
   */
  static placeOfSupply(input: IPlaceOfSupplyInput): IPlaceOfSupply {
    if (input.transactionType === TransactionType.PRODUCT) {
      return {
        countryCode: code(input.deliveryCountryCode) || null,
        stateCode: gstStateCode(input.deliveryStateCode),
        source: 'DELIVERY',
        stateDiffersFromBilling: false,
      };
    }
    const gstin =
      code(input.supplierCountryCode) === 'IN' && code(input.billingCountryCode) === 'IN'
        ? TaxRegistrationNumberUtil.checkGstin(input.customerRegistrationNumber)
        : null;
    if (gstin?.valid && gstin.stateCode) {
      return {
        countryCode: 'IN',
        stateCode: gstin.stateCode,
        source: 'GSTIN',
        stateDiffersFromBilling: !!code(input.billingStateCode) && !sameState(input.billingStateCode, gstin.stateCode),
      };
    }
    return {
      countryCode: code(input.billingCountryCode) || null,
      stateCode: gstStateCode(input.billingStateCode),
      source: 'BILLING',
      stateDiffersFromBilling: false,
    };
  }

  /**
   * DOMESTIC route = domestic money; every other known route is foreign money (IGST s.2(6)(iv)). An unknown
   * route is no fact at all, so a money-conditioned rule can't match it.
   */
  static moneyOrigin(route: PaymentRouteEnum | string | null | undefined): MoneyOriginEnum | null {
    if (!route || !(Object.values(PaymentRouteEnum) as string[]).includes(route)) {
      return null;
    }
    return route === PaymentRouteEnum.DOMESTIC ? MoneyOriginEnum.DOMESTIC : MoneyOriginEnum.FOREIGN;
  }

  static matches(rule: ITaxRuleMatchable, facts: ITaxRuleFacts): boolean {
    if (!rule.active || rule.fallbackOnly) {
      return false;
    }
    if (rule.franchiseId !== facts.franchiseId || rule.transactionType !== facts.transactionType) {
      return false;
    }
    const supplier = code(facts.supplierCountryCode);
    if (code(rule.countryCode) !== supplier) {
      return false;
    }
    const supplyDate = day(facts.supplyDate);
    const from = day(rule.effectiveFrom);
    const to = day(rule.effectiveTo);
    if (!supplyDate || !from || from > supplyDate || (to !== null && to < supplyDate)) {
      return false;
    }
    const place = code(facts.placeOfSupplyCountryCode);
    if (!place) {
      // No place of supply, no rule: missing data never makes a sale foreign (or domestic)
      return false;
    }
    const domestic = place === supplier;
    switch (rule.customerScope) {
      case CustomerScopeEnum.SAME_COUNTRY:
        if (!domestic) return false;
        break;
      case CustomerScopeEnum.SPECIFIC_COUNTRY:
        if (place !== code(rule.placeOfSupplyCountryCode)) return false;
        break;
      case CustomerScopeEnum.ANY_FOREIGN:
        if (domestic) return false;
        break;
      case CustomerScopeEnum.ANY:
        break;
      default:
        return false;
    }
    if (rule.stateRelation !== StateRelationEnum.ANY) {
      // An unknown State counts as another State: a guard is never bypassed by missing data
      const same = domestic && sameState(facts.placeOfSupplyStateCode, facts.supplierStateCode);
      if ((rule.stateRelation === StateRelationEnum.SAME) !== same) return false;
    }
    if (rule.registrationCondition !== RegistrationConditionEnum.ANY) {
      if ((rule.registrationCondition === RegistrationConditionEnum.REGISTERED) !== facts.registered) return false;
    }
    if (rule.customerTypeCondition !== CustomerTypeConditionEnum.ANY && rule.customerTypeCondition !== facts.customerType) {
      return false;
    }
    if (rule.electronicCondition !== ElectronicConditionEnum.ANY) {
      if ((rule.electronicCondition === ElectronicConditionEnum.YES) !== facts.electronic) return false;
    }
    if (rule.moneyCondition !== MoneyConditionEnum.ANY && rule.moneyCondition !== facts.money) {
      return false;
    }
    if (rule.appliesTo === RuleAppliesToEnum.SPECIFIC && Number(rule.referenceId) !== Number(facts.referenceId)) {
      return false;
    }
    return true;
  }

  /** The D4 precedence vector (higher wins, compared left to right); dimension 8 is the date. */
  static rank(rule: ITaxRuleMatchable): [number, number, number, number, number, number, number, string] {
    const set = (value: string, any: string): number => (value === any ? 0 : 1);
    const scope =
      rule.customerScope === CustomerScopeEnum.SPECIFIC_COUNTRY ? 2 : rule.customerScope === CustomerScopeEnum.ANY ? 0 : 1;
    return [
      scope,
      set(rule.stateRelation, StateRelationEnum.ANY),
      set(rule.registrationCondition, RegistrationConditionEnum.ANY),
      set(rule.customerTypeCondition, CustomerTypeConditionEnum.ANY),
      set(rule.electronicCondition, ElectronicConditionEnum.ANY),
      set(rule.moneyCondition, MoneyConditionEnum.ANY),
      rule.appliesTo === RuleAppliesToEnum.SPECIFIC ? 1 : 0,
      day(rule.effectiveFrom) ?? '',
    ];
  }

  /** Negative when `a` wins over `b`, positive when `b` wins, 0 on a full tie. */
  static compare(a: ITaxRuleMatchable, b: ITaxRuleMatchable): number {
    const left = TaxRuleMatchUtil.rank(a);
    const right = TaxRuleMatchUtil.rank(b);
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) {
        return left[index] > right[index] ? -1 : 1;
      }
    }
    return 0;
  }

  /** The matching rules of a sale, best first. */
  static resolve<T extends ITaxRuleMatchable>(rules: T[], facts: ITaxRuleFacts): ITaxRuleResolution<T> {
    const matching = rules.filter((rule) => TaxRuleMatchUtil.matches(rule, facts)).sort(TaxRuleMatchUtil.compare);
    const [winner = null, ...runnersUp] = matching;
    return {
      winner,
      runnersUp,
      ambiguous: winner !== null && runnersUp.length > 0 && TaxRuleMatchUtil.compare(winner, runnersUp[0]) === 0,
    };
  }

  /** The winning rule, or null. */
  static winner<T extends ITaxRuleMatchable>(rules: T[], facts: ITaxRuleFacts): T | null {
    return TaxRuleMatchUtil.resolve(rules, facts).winner;
  }

  /**
   * The key two active rules may not share (D4; the `ux_mst_tax_master_rule` index): franchise, supplier
   * country, type, the conditions, the plan / product of a SPECIFIC rule, and effective_from.
   */
  static key(rule: ITaxRuleMatchable): string {
    return [
      rule.franchiseId,
      code(rule.countryCode),
      rule.transactionType,
      rule.customerScope,
      code(rule.placeOfSupplyCountryCode),
      rule.stateRelation,
      rule.registrationCondition,
      rule.customerTypeCondition,
      rule.electronicCondition,
      rule.moneyCondition,
      rule.appliesTo,
      rule.appliesTo === RuleAppliesToEnum.SPECIFIC ? Number(rule.referenceId) : 0,
      day(rule.effectiveFrom),
    ].join('|');
  }

  /**
   * Active normal rules the candidate would duplicate (refused at save). A later effective_from is not a
   * duplicate (it supersedes from its date); fallback-only and inactive rules never are.
   */
  static duplicates<T extends ITaxRuleMatchable>(candidate: ITaxRuleMatchable, rules: T[]): T[] {
    if (!candidate.active || candidate.fallbackOnly) {
      return [];
    }
    const key = TaxRuleMatchUtil.key(candidate);
    return rules.filter(
      (rule) =>
        rule.active &&
        !rule.fallbackOnly &&
        (candidate.id === null || candidate.id === undefined || rule.id !== candidate.id) &&
        TaxRuleMatchUtil.key(rule) === key,
    );
  }

  /** Preview warning: a plan- or product-specific rule that matches but loses on an earlier dimension. */
  static shadowingWarnings(resolution: ITaxRuleResolution): ITaxRuleSaveWarning[] {
    const winner = resolution.winner;
    if (!winner || winner.appliesTo === RuleAppliesToEnum.SPECIFIC) {
      return [];
    }
    return resolution.runnersUp
      .filter((rule) => rule.appliesTo === RuleAppliesToEnum.SPECIFIC)
      .map((rule) => ({
        code: 'SPECIFIC_RULE_SHADOWED',
        message: `Rule ${rule.id ?? ''} for this plan / product matches but loses to rule ${winner.id ?? ''}, whose conditions are more specific (conditions come before "specific plan").`.replace(/ {2,}/g, ' '),
      }));
  }
}
