import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TaxInput, TaxResult } from '../interfaces/tax.interface';
import { IndiaGstService } from './india-gst.service';
import { VatService } from './vat.service';
import { UsSalesTaxService } from './us-sales-tax.service';
import { LutService } from './lut.service';
import { TaxMasterService } from './tax-master.service';
import {
  PaymentRouteEnum,
  TaxCategoryEnum,
  TaxMode,
  TaxTypeEnum,
  TransactionType,
} from '@eatfit247-shared-lib';
import { CountryService, FranchiseDateUtil } from '@server_1/platform';
import { MstFranchise } from '@server_1/core';
import { MstTaxMaster } from '../models';
import {
  EXPORT_UNDER_LUT_NOTE,
  EXPORT_WITH_IGST_NOTE,
  INDIA_COUNTRY_CODE,
  UAE_ZERO_RATED_EXPORT_NOTE,
} from '../constants/tax-notes.constant';

interface ITaxContext {
  input: TaxInput;
  rule: MstTaxMaster;
  /** Amount tax is charged on (after discount, tax backed out of inclusive prices) */
  taxable: number;
  supplier: string;
  customer: string;
  supplyDate: string;
  countryName: (code: string) => string;
}

/**
 * Decides and calculates tax at payment time (principle 1, roadmap 4.6).
 *
 * Domestic vs export is decided by the supplier's country (franchise address) vs the customer's
 * (billing address; delivery address for goods). The rate comes from the franchise's own-country
 * rule in Tax Master; the export treatment from the supplier's tax system:
 *   - India (GST): services are exports only when the money is foreign (decision 2), goods when
 *     delivered abroad (decision 3); 0% under a valid LUT, else IGST (decision 4).
 *   - VAT: zero-rated export for customers outside the supplier's country.
 * Indian customers are only served by Indian franchises (decision 6). A missing rule or missing
 * address data is an error, never a silent "no tax" (decisions 8, 9).
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
    if (customer === INDIA_COUNTRY_CODE && supplier !== INDIA_COUNTRY_CODE) {
      throw new BadRequestException('Indian clients must be registered under the India franchise.');
    }

    const supplyDate = this.toLocalDate(input.supplyDate);
    const rule = await this.taxMasterService.getApplicableTaxRule({
      franchiseId: input.franchiseId,
      referenceId: input.referenceId,
      transactionType: input.transactionType,
      countryCode: supplier,
      onDate: new Date(`${supplyDate}T00:00:00Z`),
    });
    if (!rule) {
      throw new BadRequestException(
        `No active tax rule for franchise ${input.franchiseId}, country ${supplier}, ` +
          `${input.transactionType} (reference ${input.referenceId}). Add it in Tax Master.`,
      );
    }
    await this.assertRegistration(input.franchiseId, rule);

    const rate = Number(rule.taxPercent || 0);
    const taxable = rule.isTaxInclusive
      ? Math.max(input.baseAmount / (1 + rate / 100) - input.discountAmount, 0)
      : input.baseAmount - input.discountAmount;
    const countries = await this.countryService.findAll({ page: 0, limit: 1000 });
    const countryName = (code: string): string =>
      countries.tableData.find((c) => this.normalize(c.countryCode) === code)?.country || code;
    const context: ITaxContext = { input, rule, taxable, supplier, customer, supplyDate, countryName };

    const placeOfSupplyCountry =
      input.transactionType === TransactionType.PRODUCT ? this.normalize(input.deliveryCountryCode) || customer : customer;
    const result =
      placeOfSupplyCountry === supplier
        ? await this.domestic(context)
        : await this.crossBorder(context, placeOfSupplyCountry);
    return {
      ...result,
      baseAmount: taxable + input.discountAmount,
      discount: input.discountAmount,
      entityCountry: countryName(supplier),
      customerCountry: countryName(customer),
      placeOfSupply: countryName(placeOfSupplyCountry),
    };
  }

  /** Supplier and place of supply in the same country: the franchise's own rule. */
  private async domestic(context: ITaxContext): Promise<TaxResult> {
    const { rule, taxable, input } = context;
    const rate = Number(rule.taxPercent || 0);
    switch (rule.taxSystem) {
      case TaxTypeEnum.GST: {
        const isGoods = input.transactionType === TransactionType.PRODUCT;
        const customerState = isGoods ? input.deliveryStateCode || input.customerStateCode : input.customerStateCode;
        if (!customerState) {
          throw new BadRequestException(`A ${isGoods ? 'delivery' : 'billing'} state is required for GST.`);
        }
        if (!input.supplierStateCode) {
          throw new BadRequestException('The franchise address has no state. Add it before calculating GST.');
        }
        const gst = this.indiaGst.calculate(
          { ...input, customerStateCode: customerState },
          taxable,
          rate,
        );
        const sameState = !!gst.taxObj['CGST'];
        return {
          ...gst,
          taxMode: TaxMode.DOMESTIC_GST,
          isLutApplied: false,
          taxCategory: null,
          lutArn: null,
          paymentRoute: this.route(input),
          taxDecisionReason: sameState ? `CGST + SGST ${rate}% (same state)` : `IGST ${rate}% (another state)`,
        };
      }
      case TaxTypeEnum.VAT:
        return this.vat(context, rate, rule.taxCategory, null, `VAT ${rate}% (${this.categoryLabel(rule.taxCategory)})`);
      case TaxTypeEnum.SALES_TAX: {
        const result = await this.usSalesTax.calculate(input.customerStateCode || null, taxable);
        return {
          ...result,
          taxMode: TaxMode.SALES_TAX,
          isLutApplied: false,
          taxDecisionReason: 'Sales tax by billing state',
        };
      }
      default:
        return this.noTax(taxable, 'The franchise is not registered for tax');
    }
  }

  /** Place of supply outside the supplier's country. */
  private async crossBorder(context: ITaxContext, destination: string): Promise<TaxResult> {
    const { rule, taxable, input, supplier } = context;
    if (supplier === INDIA_COUNTRY_CODE && rule.taxSystem === TaxTypeEnum.GST) {
      if (input.transactionType === TransactionType.PRODUCT) {
        return this.indianExport(context, TaxMode.EXPORT_OF_GOODS, `Goods delivered to ${context.countryName(destination)}`);
      }
      const route = this.route(input);
      if (route === PaymentRouteEnum.DOMESTIC) {
        // Not an export (IGST Act s.2(6)(iv)) but still an inter-state supply (s.7(5)(a))
        return this.igst(context, TaxMode.DOMESTIC_GST, null, route, `IGST ${Number(rule.taxPercent)}%: INR paid over Indian payment methods by a client outside India (not an export)`);
      }
      return this.indianExport(context, TaxMode.EXPORT_OF_SERVICE, `Export of service paid via ${this.routeLabel(route)}`);
    }
    if (supplier === INDIA_COUNTRY_CODE) {
      // An unregistered Indian franchise can't file an LUT, so it can't export (decision 18)
      throw new BadRequestException(
        'This franchise is not GST-registered, so it cannot invoice an export. Ask the CA before selling abroad.',
      );
    }
    if (rule.taxSystem === TaxTypeEnum.VAT) {
      return this.vat(
        context,
        0,
        TaxCategoryEnum.ZERO_RATED,
        UAE_ZERO_RATED_EXPORT_NOTE,
        `Zero-rated export: recipient outside ${context.countryName(supplier)} (billing address)`,
      );
    }
    return this.noTax(taxable, rule.taxSystem === TaxTypeEnum.NONE ? 'The franchise is not registered for tax' : 'Outside the franchise tax jurisdiction');
  }

  /** Indian export: 0% under the LUT valid on the supply date, else IGST at the rule rate (decision 4). */
  private async indianExport(context: ITaxContext, mode: TaxMode, reason: string): Promise<TaxResult> {
    const { input, taxable, supplyDate } = context;
    const route = input.transactionType === TransactionType.PRODUCT ? input.paymentRoute ?? null : this.route(input);
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
      `${reason}: no valid LUT on ${supplyDate}, IGST ${Number(context.rule.taxPercent)}% charged (refundable)`,
    );
  }

  private igst(
    context: ITaxContext,
    mode: TaxMode,
    note: string | null,
    route: PaymentRouteEnum | null,
    reason: string,
  ): TaxResult {
    const rate = Number(context.rule.taxPercent || 0);
    const taxAmount = (context.taxable * rate) / 100;
    return {
      baseAmount: context.taxable,
      discount: context.input.discountAmount,
      taxType: TaxTypeEnum.GST,
      taxPercentage: rate,
      taxAmount,
      taxObj: { IGST: { amount: taxAmount, taxPercentage: rate } },
      totalAmount: context.taxable + taxAmount,
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

  /** A GST rule needs the franchise's GSTIN; a VAT rule its TRN (decision 18). */
  private async assertRegistration(franchiseId: number, rule: MstTaxMaster): Promise<void> {
    if (rule.taxSystem !== TaxTypeEnum.GST && rule.taxSystem !== TaxTypeEnum.VAT) {
      return;
    }
    const franchise = await this.franchiseRepository.findByPk(franchiseId, {
      attributes: ['franchiseId', 'gstNumber', 'vatNumber'],
    });
    if (rule.taxSystem === TaxTypeEnum.GST && !franchise?.gstNumber?.trim()) {
      throw new BadRequestException(
        'This franchise has a GST tax rule but no GSTIN. Add the GSTIN, or set its rule to "no tax" if it is not registered.',
      );
    }
    if (rule.taxSystem === TaxTypeEnum.VAT && !franchise?.vatNumber?.trim()) {
      throw new BadRequestException(
        'This franchise has a VAT tax rule but no TRN. Add the TRN, or set its rule to "no tax" if it is not registered.',
      );
    }
  }

  /** Gateway records: non-INR orders can only be paid from abroad; INR may be paid domestically. */
  private route(input: TaxInput): PaymentRouteEnum {
    if (input.paymentRoute) {
      return input.paymentRoute;
    }
    return (input.currency || '').toUpperCase() === 'INR'
      ? PaymentRouteEnum.DOMESTIC
      : PaymentRouteEnum.INTERNATIONAL_CARD_GATEWAY;
  }

  private routeLabel(route: PaymentRouteEnum): string {
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

  private toLocalDate(value: Date | string | null | undefined): string {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }
    const date = value ? new Date(value) : new Date();
    return FranchiseDateUtil.localDate(Number.isNaN(date.getTime()) ? new Date() : date, 'Asia/Kolkata');
  }

  private normalize(code: string | null | undefined): string | null {
    const value = (code || '').trim().toUpperCase();
    return value || null;
  }
}
