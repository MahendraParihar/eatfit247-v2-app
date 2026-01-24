import { Injectable } from '@nestjs/common';
import { ITaxCalculationInput, TaxInput, TaxResult } from '../interfaces/tax.interface';
import { IndiaGstService } from './india-gst.service';
import { VatService } from './vat.service';
import { UsSalesTaxService } from './us-sales-tax.service';
import { TaxMode, TaxTypeEnum } from '@eatfit247-shared-lib';
import { CountryService } from '@server_1/platform';
import { TaxMasterService } from './tax-master.service';

@Injectable()
export class TaxEngineService {
  constructor(
    private readonly indiaGst: IndiaGstService,
    private readonly vatService: VatService,
    private readonly usSalesTax: UsSalesTaxService,
    private readonly countryService: CountryService,
    private readonly taxMasterService: TaxMasterService,
  ) {}

  async calculate(input: TaxInput): Promise<TaxResult> {
    const taxableAmount = input.baseAmount - input.discountAmount;
    // 1️⃣ Fetch tax rule (SINGLE SOURCE OF TRUTH)
    const taxRule = await this.taxMasterService.getApplicableTaxRule(<ITaxCalculationInput>{
      franchiseId: input.franchiseId,
      referenceId: input.referenceId,
      buyerCountryCode: input.customerCountryCode,
      transactionType: input.transactionType,
    });
    if (!taxRule || taxRule.taxPercent === 0) {
      return this.noTax(taxableAmount);
    }
    const countries = await this.countryService.findAll({ page: 0, limit: 1000 });
    const supplierCountry = countries.tableData.find(
      (c) => c.countryCode === input.supplierCountryCode,
    );
    const customerCountry = countries.tableData.find(
      (c) => c.countryCode === input.customerCountryCode,
    );
    // 🔴 EXPORT OF SERVICE (INDIA → INTERNATIONAL)
    if (
      taxRule.countryCode === 'IN' &&
      input.supplierCountryCode === 'IN' &&
      input.customerCountryCode !== 'IN'
    ) {
      if (input.currency === 'INR') {
        throw new Error('Export of service requires foreign currency payment');
      }
      return {
        taxType: TaxTypeEnum.GST,
        taxPercentage: 0,
        taxAmount: 0,
        taxObj: {},
        totalAmount: taxableAmount,
        taxMode: TaxMode.EXPORT_OF_SERVICE,
        invoiceNote: 'Supply meant for export under LUT without payment of IGST',
        isLutApplied: true,
        entityCountry: supplierCountry.country,
        placeOfSupply: customerCountry.country,
        customerCountry: customerCountry.country,
      };
    }
    let taxObject: TaxResult;
    switch (taxRule.taxSystem) {
      case TaxTypeEnum.GST:
        taxObject = {
          ...this.indiaGst.calculate(input, taxableAmount, taxRule.taxPercent),
          taxMode: TaxMode.DOMESTIC_GST,
          isLutApplied: false,
        };
        break;
      case TaxTypeEnum.VAT:
        taxObject = {
          ...this.vatService.calculate(taxRule.taxPercent, taxableAmount),
          taxMode: TaxMode.VAT,
          isLutApplied: false,
        };
        break;
      case TaxTypeEnum.SALES_TAX:
        // US Sales Tax is calculated based on the customer's billing address state
        const result = await this.usSalesTax.calculate(
          input.customerStateCode || null,
          taxableAmount,
        );
        taxObject = {
          ...result,
          taxMode: TaxMode.SALES_TAX,
          isLutApplied: false,
        };
        break;
      default:
        taxObject = this.noTax(taxableAmount);
        break;
    }
    return {
      ...taxObject,
      entityCountry: supplierCountry.country,
      placeOfSupply: customerCountry.country,
      customerCountry: customerCountry.country,
    };
  }

  private noTax(amount: number): TaxResult {
    return {
      taxType: TaxTypeEnum.NONE,
      taxPercentage: 0,
      taxAmount: 0,
      taxObj: {},
      totalAmount: amount,
      taxMode: TaxMode.NO_TAX,
      isLutApplied: false,
      entityCountry: '',
      placeOfSupply: '',
      customerCountry: '',
    };
  }
}