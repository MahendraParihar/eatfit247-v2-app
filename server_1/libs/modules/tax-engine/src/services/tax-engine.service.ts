import { Injectable } from '@nestjs/common';
import { TaxInput, TaxResult } from '../interfaces/tax.interface';
import { IndiaGstService } from './india-gst.service';
import { VatService } from './vat.service';
import { UsSalesTaxService } from './us-sales-tax.service';
import { TaxMode, TaxTypeEnum } from '@eatfit247-shared-lib';
import { CountryService } from '@server_1/platform';

@Injectable()
export class TaxEngineService {
  constructor(
    private readonly indiaGst: IndiaGstService,
    private readonly vatService: VatService,
    private readonly usSalesTax: UsSalesTaxService,
    private readonly countryService: CountryService,
  ) {}

  async calculate(input: TaxInput): Promise<TaxResult> {
    console.log('-------------------------------------');
    console.log(input);
    const taxableAmount = input.baseAmount - input.discountAmount;
    if (input.isTaxApplicable === false) {
      return this.noTax(taxableAmount);
    }
    const countries = await this.countryService.findAll({ page: 0, limit: 1000 });
    const supplierCountry = countries.tableData.find(
      (c) => c.countryCode === input.supplierCountryCode,
    );
    const customerCountry = countries.tableData.find(
      (c) => c.countryCode === input.customerCountryCode,
    );
    console.log('--------------------------------------');
    console.log(supplierCountry, customerCountry);
    if (!supplierCountry || supplierCountry.taxType === TaxTypeEnum.NONE) {
      return this.noTax(taxableAmount);
    }
    const isDomestic = supplierCountry.countryCode === customerCountry.countryCode;
    // 🔴 EXPORT OF SERVICE (INDIA → INTERNATIONAL)
    if (supplierCountry.countryCode === 'IN' && !isDomestic) {
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
    switch (supplierCountry.taxType) {
      case TaxTypeEnum.GST:
        taxObject = {
          ...this.indiaGst.calculate(input, taxableAmount, supplierCountry.defaultTaxPercentage),
          taxMode: TaxMode.DOMESTIC_GST,
          isLutApplied: false,
        };
        break;
      case TaxTypeEnum.VAT:
        taxObject = {
          ...this.vatService.calculate(supplierCountry.defaultTaxPercentage || 0, taxableAmount),
          taxMode: isDomestic ? TaxMode.DOMESTIC_GST : TaxMode.VAT,
          isLutApplied: false,
        };
        break;
      case TaxTypeEnum.SALES_TAX:
        // US Sales Tax is calculated based on customer's billing address state
        const result = await this.usSalesTax.calculate(
          input.customerStateCode || null,
          taxableAmount,
        );
        taxObject = {
          ...result,
          taxMode: isDomestic ? TaxMode.DOMESTIC_GST : TaxMode.VAT,
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