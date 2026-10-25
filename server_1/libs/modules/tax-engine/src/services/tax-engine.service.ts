import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TaxInput, TaxResult } from '../interfaces/tax.interface';
import { IndiaGstService } from './india-gst.service';
import { VatService } from './vat.service';
import { UsSalesTaxService } from './us-sales-tax.service';
import { LutService } from './lut.service';
import { TaxMasterService } from './tax-master.service';
import { TaxRegistrationService } from './tax-registration.service';
import {
  CustomerTypeEnum,
  IAuthUser,
  ICalculateTaxResponse,
  ITaxEvidence,
  ITaxRuleFacts,
  ITaxRulePreviewRequest,
  ITaxRulePreviewResponse,
  MoneyOriginEnum,
  PaymentRouteEnum,
  TaxCategoryEnum,
  TaxEvidenceIndicatorResultEnum,
  TaxEvidenceStatusEnum,
  TaxMode,
  TaxRuleMatchUtil,
  TaxTreatmentEnum,
  TaxTypeEnum,
  TransactionType,
  gstStateCode,
} from '@eatfit247-shared-lib';
import { CountryService, FranchiseDateUtil } from '@server_1/platform';
import { MstFranchise } from '@server_1/core';
import { MstTaxMaster } from '../models';
import { EXPORT_UNDER_LUT_NOTE, EXPORT_WITH_IGST_NOTE, INDIA_COUNTRY_CODE } from '../constants/tax-notes.constant';

interface ITaxContext {
  input: TaxInput;
  /** The rule that matched: it decides the treatment */
  rule: MstTaxMaster;
  /** The rule whose rate, inclusive flag and HSN/SAC price the sale: the matched rule, or for a GST sale abroad the supply's own same-country rule (D3, group 6b) */
  priceRule: MstTaxMaster;
  /** The rate charged: the price rule's, 0 when a GST rule meets no GST registration */
  rate: number;
  facts: ITaxRuleFacts;
  /** Amount tax is charged on (after discount, tax backed out of inclusive prices at the rule's rate) */
  taxable: number;
  /** A GST rule on a franchise without an active GST registration (decision 6: priced as no tax) */
  unregistered: boolean;
  gstRegistered: boolean;
  supplier: string;
  /** Delivery country for goods, billing country for services */
  placeOfSupply: string;
  domestic: boolean;
  /** How the money arrived, as decided from the currency and the chosen route */
  route: PaymentRouteEnum | null;
  supplyDate: string;
  countryName: (code: string) => string;
}

/**
 * Decides and calculates tax at payment time (principle 1, roadmap 4.6; configurable tax treatment 4.14).
 *
 * 1. Code invariants (decision 6), in today's order: the franchise and billing countries, the Indian-client
 *    refusal for non-Indian franchises, the goods delivery address.
 * 2. The facts of the sale on its place of supply (billing address for services, delivery for goods), the
 *    franchise's registration on the supply date, the plan's electronic flag and the money route.
 * 3. The Tax Master rule that matches them (`TaxMasterService.resolveOrThrow`, D4 precedence).
 * 4. Its treatment's executor: the mechanics (CGST+SGST / IGST, LUT, VAT categories, rounding) and the legal
 *    invariants stay here; what is taxed how is the rule.
 * A missing rule or missing address data is an error, never a silent "no tax".
 */
@Injectable()
export class TaxEngineService {
  constructor(
    private readonly indiaGst: IndiaGstService,
    private readonly vatService: VatService,
    private readonly usSalesTax: UsSalesTaxService,
    private readonly countryService: CountryService,
    private readonly taxMasterService: TaxMasterService,
    private readonly lutService: LutService,
    @InjectModel(MstFranchise) private readonly franchiseRepository: typeof MstFranchise,
    private readonly taxRegistrationService: TaxRegistrationService,
  ) {}

  async calculate(input: TaxInput): Promise<TaxResult> {
    const supplier = this.normalize(input.supplierCountryCode);
    const customer = this.normalize(input.customerCountryCode);
    if (!supplier) {
      throw new BadRequestException(
        'The franchise address has no country. Add the franchise address before calculating tax.',
      );
    }
    if (!customer) {
      throw new BadRequestException('A billing address with a country is required to calculate tax.');
    }
    // IGST s.14 (OIDAR): an Indian client is only served by an Indian franchise; no rule overrides it
    if (customer === INDIA_COUNTRY_CODE && supplier !== INDIA_COUNTRY_CODE) {
      throw new BadRequestException('Indian clients must be registered under the India franchise.');
    }
    const isGoods = input.transactionType === TransactionType.PRODUCT;
    const delivery = this.normalize(input.deliveryCountryCode);
    if (isGoods && !delivery) {
      // Goods are taxed where they are delivered; the billing country isn't a substitute
      throw new BadRequestException('A shipping address with a country is required for product orders.');
    }
    if (isGoods && delivery === INDIA_COUNTRY_CODE && supplier === INDIA_COUNTRY_CODE && !this.normalize(input.deliveryStateCode)) {
      // IGST s.10: the delivery State decides CGST/SGST vs IGST; the billing State is never a substitute
      throw new BadRequestException('A shipping address with a state is required for product orders delivered in India.');
    }

    const franchise = await this.franchiseRepository.findByPk(input.franchiseId, {
      attributes: ['franchiseId', 'timeZone', 'currencyCode'],
    });
    if (!franchise?.currencyCode?.trim()) {
      // Domestic money is the franchise's own currency (decision 17): without it the money route can't be decided
      throw new BadRequestException('The franchise has no working currency. Set it on the franchise form before pricing a sale.');
    }
    // The supply date is the franchise's local calendar day (LUT validity, rule and registration dates)
    const supplyDate = this.toLocalDate(input.supplyDate, franchise?.timeZone);
    const registrations = await this.taxRegistrationService.findActive(input.franchiseId, supplyDate);
    const home =
      registrations.find(
        (r) => r.taxSystem === TaxRegistrationService.homeTaxSystem(supplier) && this.normalize(r.countryCode) === supplier,
      ) ?? null;
    const gstRegistered = registrations.some((r) => r.taxSystem === TaxTypeEnum.GST && this.normalize(r.countryCode) === INDIA_COUNTRY_CODE);
    const vatRegistered = registrations.some((r) => r.taxSystem === TaxTypeEnum.VAT && this.normalize(r.countryCode) === supplier);

    const place = TaxRuleMatchUtil.placeOfSupply({
      transactionType: input.transactionType,
      supplierCountryCode: supplier,
      billingCountryCode: customer,
      billingStateCode: input.customerStateCode,
      deliveryCountryCode: delivery,
      deliveryStateCode: input.deliveryStateCode,
    });
    // Money in the franchise's own currency over a domestic route is domestic money (decision 17)
    const route = TaxMasterService.paymentRoute(input.currency, input.paymentRoute, franchise.currencyCode);
    const facts: ITaxRuleFacts = {
      franchiseId: input.franchiseId,
      supplierCountryCode: supplier,
      supplierStateCode: gstStateCode(input.supplierStateCode),
      transactionType: input.transactionType,
      referenceId: Number(input.referenceId),
      placeOfSupplyCountryCode: place.countryCode ?? '',
      placeOfSupplyStateCode: place.stateCode,
      registered: !!home,
      customerType: CustomerTypeEnum.B2C,
      electronic: isGoods ? false : await this.taxMasterService.isElectronicPlan(Number(input.referenceId)),
      money: isGoods ? null : TaxRuleMatchUtil.moneyOrigin(route),
      supplyDate,
    };
    const rule = await this.taxMasterService.resolveOrThrow(facts);
    if (
      rule.taxSystem === TaxTypeEnum.VAT &&
      rule.treatment !== TaxTreatmentEnum.REFUSE &&
      rule.treatment !== TaxTreatmentEnum.FOREIGN_REGISTRATION &&
      !vatRegistered
    ) {
      // UAE Decree-Law Art 50 / ER Art 59: VAT is charged only by a registrant (4.6 decision 18)
      throw new BadRequestException(
        'This franchise has a VAT tax rule but no TRN. Add the TRN, or set its rule to "no tax" if it is not registered.',
      );
    }
    // CGST s.22 / s.24: no GST registration → no GST; an inclusive price is then charged in full
    const unregistered = rule.taxSystem === TaxTypeEnum.GST && !gstRegistered;
    const placeOfSupply = place.countryCode as string;
    const domestic = placeOfSupply === supplier;
    const priceRule = unregistered ? rule : await this.priceRule(rule, facts, domestic);
    const rate = unregistered ? 0 : Number(priceRule.taxPercent || 0);
    const taxable = priceRule.isTaxInclusive
      ? Math.max(input.baseAmount / (1 + rate / 100) - input.discountAmount, 0)
      : input.baseAmount - input.discountAmount;
    const countries = await this.countryService.findAll({ page: 0, limit: 1000 });
    const countryName = (code: string): string =>
      countries.tableData.find((c) => this.normalize(c.countryCode) === code)?.country || code;
    const context: ITaxContext = {
      input,
      rule,
      priceRule,
      rate,
      facts,
      taxable,
      unregistered,
      gstRegistered,
      supplier,
      placeOfSupply,
      domestic,
      route,
      supplyDate,
      countryName,
    };

    const result = await this.execute(context);
    // Stored with the decision (Circular 242/36/2024): the State only exists for a domestic supply
    const placeOfSupplyState = domestic ? this.normalize(isGoods ? input.deliveryStateCode : input.customerStateCode) : null;
    return {
      ...result,
      baseAmount: taxable + input.discountAmount,
      discount: input.discountAmount,
      entityCountry: countryName(supplier),
      customerCountry: countryName(customer),
      placeOfSupply: countryName(placeOfSupply),
      placeOfSupplyCountryCode: placeOfSupply,
      placeOfSupplyStateCode: placeOfSupplyState,
      hsnSacCode: priceRule.hsnSacCode?.trim() || null,
      taxMasterId: rule.id,
      taxRegistrationId: home?.taxRegistrationId ?? null,
      // Not assessed until the customer GSTIN / TRN feeds the facts (plan group 9): stored NULL, never a guessed B2C
      customerType: null,
      requiresEvidence: !!rule.requiresEvidence,
    };
  }

  /**
   * Whose rate prices the sale (requirements D3, group 6b): a GST export or IGST on a sale abroad is charged at the
   * supply's own rate (its same-country GST rule on the supply date, as before 4.14); everything else at the matched
   * rule's own rate.
   */
  private async priceRule(rule: MstTaxMaster, facts: ITaxRuleFacts, domestic: boolean): Promise<MstTaxMaster> {
    const gstAbroad =
      rule.taxSystem === TaxTypeEnum.GST &&
      (rule.treatment === TaxTreatmentEnum.EXPORT_LUT_OR_TAX || (rule.treatment === TaxTreatmentEnum.CHARGE && !domestic));
    if (!gstAbroad) {
      return rule;
    }
    const supplyRule = await this.taxMasterService.supplyRateRule(facts);
    if (!supplyRule) {
      throw new BadRequestException(TaxMasterService.noRuleMessage(facts));
    }
    return supplyRule;
  }

  /**
   * Which rule would price the sale and, given an amount, what it charges (decision 7, plan 6.5). Nothing is
   * saved; scoped like the Tax Master list. A refusal or missing data is returned as a warning.
   */
  async preview(request: ITaxRulePreviewRequest, user: IAuthUser): Promise<ITaxRulePreviewResponse> {
    const response = await this.taxMasterService.preview(request, user);
    if (request.amount === null || request.amount === undefined || !response.winner) {
      return response;
    }
    const franchise = await this.franchiseRepository.findByPk(request.franchiseId, { attributes: ['franchiseId', 'currencyCode'] });
    const currency = (request.currency || franchise?.currencyCode || '').trim().toUpperCase();
    try {
      const result = await this.calculate({
        baseAmount: Number(request.amount),
        discountAmount: 0,
        franchiseId: request.franchiseId,
        referenceId: Number(request.referenceId),
        supplierCountryCode: response.facts.supplierCountryCode,
        supplierStateCode: response.facts.supplierStateCode,
        customerCountryCode: request.billingCountryCode ?? null,
        customerStateCode: gstStateCode(request.billingStateCode),
        deliveryCountryCode: request.deliveryCountryCode ?? null,
        deliveryStateCode: gstStateCode(request.deliveryStateCode),
        currency,
        transactionType: request.transactionType,
        paymentRoute: request.paymentRoute ?? null,
        supplyDate: response.facts.supplyDate,
      });
      response.tax = TaxEngineService.toResponse(result, currency);
      if (result.taxMasterId !== response.winner.id) {
        // E.g. a customer GSTIN: the preview's facts use it, pricing does from plan group 9
        response.warnings.push({
          code: 'FACTS_DIFFER',
          message: `The tax shown is rule ${result.taxMasterId}'s, not the winner's: pricing doesn't use the customer's tax number yet.`,
        });
      }
    } catch (error) {
      if (!(error instanceof BadRequestException)) {
        throw error;
      }
      response.warnings.push({ code: 'NOT_PRICED', message: error.message });
    }
    return response;
  }

  /** A result in the shape of `calculate-tax`. */
  static toResponse(result: TaxResult, currency: string): ICalculateTaxResponse {
    return {
      orderAmount: result.baseAmount,
      discountAmount: result.discount,
      taxableAmount: result.baseAmount - result.discount,
      taxAmount: result.taxAmount,
      totalAmount: result.totalAmount,
      currency,
      taxType: result.taxType,
      taxMode: result.taxMode as TaxMode,
      taxPercentage: result.taxPercentage,
      isLutApplied: result.isLutApplied,
      taxObj: result.taxObj,
      jurisdiction: {
        entityCountry: result.entityCountry,
        customerCountry: result.customerCountry,
        placeOfSupply: result.placeOfSupply,
      },
      invoiceNote: result.invoiceNote || undefined,
      taxCategory: result.taxCategory ?? null,
      lutArn: result.lutArn ?? null,
      paymentRoute: result.paymentRoute ?? null,
      taxDecisionReason: result.taxDecisionReason ?? null,
      placeOfSupplyCountryCode: result.placeOfSupplyCountryCode ?? null,
      placeOfSupplyStateCode: result.placeOfSupplyStateCode ?? null,
      hsnSacCode: result.hsnSacCode ?? null,
      taxMasterId: result.taxMasterId ?? null,
      taxRegistrationId: result.taxRegistrationId ?? null,
      customerType: result.customerType ?? null,
      requiresEvidence: !!result.requiresEvidence,
    };
  }

  /**
   * Public checkout collects no evidence (online payments deferred, decision 9): a sale priced by a rule with
   * an evidence policy is stored as NOT_COLLECTED; any other sale stores none.
   */
  static notCollectedEvidence(result: Pick<ICalculateTaxResponse, 'requiresEvidence' | 'taxMasterId'>): ITaxEvidence | null {
    if (!result.requiresEvidence) {
      return null;
    }
    const unknown = { value: null, result: TaxEvidenceIndicatorResultEnum.NOT_AVAILABLE };
    return {
      status: TaxEvidenceStatusEnum.NOT_COLLECTED,
      taxMasterId: result.taxMasterId ?? null,
      indicators: { billingCountry: unknown, declaration: unknown, dialCode: unknown, payerAccountCountry: unknown },
      decision: null,
      checkedAt: new Date().toISOString(),
    };
  }

  // ------------------------------------------------------------------ executors (decision 3)

  private async execute(context: ITaxContext): Promise<TaxResult> {
    const { rule } = context;
    switch (rule.treatment) {
      case TaxTreatmentEnum.CHARGE:
        return this.charge(context);
      case TaxTreatmentEnum.ZERO_RATED_EXPORT:
        return this.zeroRatedExport(context);
      case TaxTreatmentEnum.EXPORT_LUT_OR_TAX:
        return this.exportLutOrTax(context);
      case TaxTreatmentEnum.OUT_OF_SCOPE:
        return this.outOfScope(context);
      case TaxTreatmentEnum.REFUSE:
        throw new BadRequestException(rule.refusalMessage?.trim() || `Tax rule ${rule.id} (${rule.taxCode}) refuses this sale.`);
      case TaxTreatmentEnum.FOREIGN_REGISTRATION:
        // Invoicing under a registration abroad (its currency, series and seller block) ships with plan group 11
        throw new BadRequestException(
          `Tax rule ${rule.id} (${rule.taxCode}) invoices this sale under the franchise's registration in ` +
            `${context.countryName(context.placeOfSupply)}, which the system can't issue yet. Ask the owner before selling it.`,
        );
      default:
        throw new BadRequestException(`Tax rule ${rule.id} (${rule.taxCode}) has an unknown treatment "${rule.treatment}".`);
    }
  }

  /** The rule's tax system at its rate. A GST rule without a GST registration prices as no tax (decision 6). */
  private async charge(context: ITaxContext): Promise<TaxResult> {
    const { rule, taxable, input, rate } = context;
    switch (context.unregistered ? TaxTypeEnum.NONE : rule.taxSystem) {
      case TaxTypeEnum.GST: {
        if (!context.domestic) {
          // IGST s.7(5)(a): a place of supply outside India is inter-state: IGST, no State
          const reason =
            context.facts.money === MoneyOriginEnum.DOMESTIC
              ? `IGST ${rate}%: INR paid over Indian payment methods by a client outside India (not an export)`
              : `IGST ${rate}%: place of supply ${context.countryName(context.placeOfSupply)} (rule ${rule.taxCode})`;
          return this.igst(context, TaxMode.DOMESTIC_GST, rule.invoiceNote?.trim() || null, context.route, reason);
        }
        const isGoods = input.transactionType === TransactionType.PRODUCT;
        // Goods: the delivery State only (IGST s.10); services: the billing State (s.12(2)(b))
        const customerState = isGoods ? input.deliveryStateCode : input.customerStateCode;
        if (!customerState) {
          throw new BadRequestException(`A ${isGoods ? 'delivery' : 'billing'} state is required for GST.`);
        }
        if (!input.supplierStateCode) {
          throw new BadRequestException('The franchise address has no state. Add it before calculating GST.');
        }
        const gst = this.indiaGst.calculate({ ...input, customerStateCode: customerState }, taxable, rate);
        const sameState = !!gst.taxObj['CGST'];
        return {
          ...gst,
          taxMode: TaxMode.DOMESTIC_GST,
          isLutApplied: false,
          invoiceNote: rule.invoiceNote?.trim() || undefined,
          taxCategory: null,
          lutArn: null,
          paymentRoute: context.route,
          taxDecisionReason: sameState ? `CGST + SGST ${rate}% (same state)` : `IGST ${rate}% (another state)`,
        };
      }
      case TaxTypeEnum.VAT:
        return this.vat(context, rate, rule.taxCategory as TaxCategoryEnum, rule.invoiceNote?.trim() || null, `VAT ${rate}% (${this.categoryLabel(rule.taxCategory)})`);
      case TaxTypeEnum.SALES_TAX: {
        if (!context.domestic) {
          return this.noTax(taxable, 'Outside the franchise tax jurisdiction');
        }
        const result = await this.usSalesTax.calculate(input.customerStateCode || null, taxable);
        return {
          ...result,
          taxMode: TaxMode.SALES_TAX,
          isLutApplied: false,
          taxDecisionReason: 'Sales tax by billing state',
        };
      }
      default:
        return this.noTax(
          taxable,
          context.unregistered ? 'No GSTIN on the franchise: invoiced without GST' : 'The franchise is not registered for tax',
        );
    }
  }

  /** VAT 0% zero-rated export (UAE ER Art 30 goods / Art 31 services); the note comes from the rule. */
  private zeroRatedExport(context: ITaxContext): TaxResult {
    const { rule, input } = context;
    if (rule.taxSystem !== TaxTypeEnum.VAT) {
      throw new BadRequestException(`Tax rule ${rule.id} (${rule.taxCode}) zero-rates under ${rule.taxSystem}: only a VAT rule can.`);
    }
    const isGoods = input.transactionType === TransactionType.PRODUCT;
    return this.vat(
      context,
      0,
      TaxCategoryEnum.ZERO_RATED,
      rule.invoiceNote?.trim() || null,
      isGoods
        ? `Zero-rated export of goods: delivered to ${context.countryName(context.placeOfSupply)} (delivery address)`
        : `Zero-rated export: recipient outside ${context.countryName(context.supplier)} (billing address)`,
    );
  }

  /** Indian export: 0% under the LUT valid on the supply date, else IGST at the rule rate (IGST s.16, Rule 96A). */
  private async exportLutOrTax(context: ITaxContext): Promise<TaxResult> {
    const { rule, input } = context;
    if (rule.taxSystem !== TaxTypeEnum.GST || !context.gstRegistered) {
      // No GSTIN, no LUT and no export invoice (decision 6)
      throw new BadRequestException(
        'This franchise is not GST-registered, so it cannot invoice an export. Ask the CA before selling abroad.',
      );
    }
    if (input.transactionType === TransactionType.PRODUCT) {
      return this.indianExport(context, TaxMode.EXPORT_OF_GOODS, `Goods delivered to ${context.countryName(context.placeOfSupply)}`);
    }
    return this.indianExport(context, TaxMode.EXPORT_OF_SERVICE, `Export of service paid via ${this.routeLabel(context.route)}`);
  }

  /** Outside the supplier's tax: no tax; on a VAT invoice, category O. */
  private outOfScope(context: ITaxContext): TaxResult {
    const { rule } = context;
    if (rule.taxSystem === TaxTypeEnum.GST && !context.gstRegistered) {
      // Like the export treatments (decision 6): a supply outside India is invoiced only by a GST registrant
      throw new BadRequestException(
        'This franchise is not GST-registered, so it cannot invoice a supply outside India. Ask the CA before selling abroad.',
      );
    }
    const reason = `Outside the scope of ${rule.taxSystem === TaxTypeEnum.NONE ? 'tax' : rule.taxSystem} (rule ${rule.taxCode})`;
    if (rule.taxSystem === TaxTypeEnum.VAT) {
      return this.vat(context, 0, TaxCategoryEnum.OUT_OF_SCOPE, rule.invoiceNote?.trim() || null, reason);
    }
    return { ...this.noTax(context.taxable, reason), invoiceNote: rule.invoiceNote?.trim() || undefined };
  }

  private async indianExport(context: ITaxContext, mode: TaxMode, reason: string): Promise<TaxResult> {
    const { input, taxable, supplyDate } = context;
    const route = input.transactionType === TransactionType.PRODUCT ? input.paymentRoute ?? null : context.route;
    const lut = await this.lutService.findValid(input.franchiseId, supplyDate);
    if (lut) {
      return {
        baseAmount: taxable,
        discount: input.discountAmount,
        taxType: TaxTypeEnum.GST,
        taxPercentage: 0,
        taxAmount: 0,
        taxObj: {},
        totalAmount: taxable,
        taxMode: mode,
        invoiceNote: EXPORT_UNDER_LUT_NOTE,
        isLutApplied: true,
        taxCategory: null,
        lutArn: lut.arn,
        paymentRoute: route,
        taxDecisionReason: `${reason}: 0% under LUT ${lut.arn}`,
        entityCountry: '',
        customerCountry: '',
        placeOfSupply: '',
      };
    }
    return this.igst(
      context,
      mode,
      EXPORT_WITH_IGST_NOTE,
      route,
      `${reason}: no valid LUT on ${supplyDate}, IGST ${context.rate}% charged (refundable)`,
    );
  }

  private igst(
    context: ITaxContext,
    mode: TaxMode,
    note: string | null,
    route: PaymentRouteEnum | null,
    reason: string,
  ): TaxResult {
    const rate = context.rate;
    const taxAmount = Math.round(((context.taxable * rate) / 100 + Number.EPSILON) * 100) / 100;
    return {
      baseAmount: context.taxable,
      discount: context.input.discountAmount,
      taxType: TaxTypeEnum.GST,
      taxPercentage: rate,
      taxAmount,
      taxObj: { IGST: { amount: taxAmount, taxPercentage: rate } },
      totalAmount: Math.round((context.taxable + taxAmount + Number.EPSILON) * 100) / 100,
      taxMode: mode,
      invoiceNote: note ?? undefined,
      isLutApplied: false,
      taxCategory: null,
      lutArn: null,
      paymentRoute: route,
      taxDecisionReason: reason,
      entityCountry: '',
      customerCountry: '',
      placeOfSupply: '',
    };
  }

  private vat(
    context: ITaxContext,
    rate: number,
    category: TaxCategoryEnum,
    note: string | null,
    reason: string,
  ): TaxResult {
    const vat = this.vatService.calculate(rate, context.taxable);
    return {
      ...vat,
      taxMode: TaxMode.VAT,
      isLutApplied: false,
      invoiceNote: note ?? undefined,
      taxCategory: category,
      lutArn: null,
      paymentRoute: context.input.paymentRoute ?? null,
      taxDecisionReason: reason,
    };
  }

  private routeLabel(route: PaymentRouteEnum | null): string {
    switch (route) {
      case PaymentRouteEnum.INTERNATIONAL_CARD_GATEWAY:
        return 'an international card / foreign-currency gateway order';
      case PaymentRouteEnum.FOREIGN_REMITTANCE:
        return 'a foreign remittance (FIRC)';
      case PaymentRouteEnum.RUPEE_VOSTRO:
        return 'a Special Rupee Vostro account';
      case PaymentRouteEnum.NRE_FCNR_ACCOUNT:
        return 'an NRE/FCNR account';
      default:
        return 'Indian payment methods';
    }
  }

  private categoryLabel(category: TaxCategoryEnum | string): string {
    return (category || TaxCategoryEnum.STANDARD).toLowerCase().replace(/_/g, '-');
  }

  private noTax(amount: number, reason: string): TaxResult {
    return {
      baseAmount: amount,
      discount: 0,
      taxType: TaxTypeEnum.NONE,
      taxPercentage: 0,
      taxAmount: 0,
      taxObj: {},
      totalAmount: amount,
      taxMode: TaxMode.NO_TAX,
      isLutApplied: false,
      taxCategory: null,
      lutArn: null,
      taxDecisionReason: reason,
      entityCountry: '',
      placeOfSupply: '',
      customerCountry: '',
    };
  }

  private toLocalDate(value: Date | string | null | undefined, timeZone?: string | null): string {
    // A plain calendar date is already local; a timestamp is converted to the franchise's calendar day
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const date = value ? new Date(value) : new Date();
    return FranchiseDateUtil.localDate(Number.isNaN(date.getTime()) ? new Date() : date, timeZone);
  }

  private normalize(code: string | null | undefined): string | null {
    const value = (code || '').trim().toUpperCase();
    return value || null;
  }
}
