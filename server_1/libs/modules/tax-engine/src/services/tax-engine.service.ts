import { Injectable } from '@nestjs/common';
import { TaxInput, TaxResult } from '../interfaces/tax.interface';
import { IndiaGstService } from './india-gst.service';
import { VatService } from './vat.service';
import { UsSalesTaxService } from './us-sales-tax.service';
import { TaxTypeEnum } from '@eatfit247-shared-lib';
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
    const taxableAmount = input.baseAmount - input.discountAmount;

    if (!input.isTaxApplicable) {
      return this.noTax(taxableAmount);
    }

    // Get country tax information
    const countries = await this.countryService.findAll({ page: 0, limit: 1000 });
    const countryTax = countries.tableData.find((c) => c.countryCode === input.supplierCountryCode);

    if (!countryTax || !countryTax.taxType || countryTax.taxType === TaxTypeEnum.NONE) {
      return this.noTax(taxableAmount);
    }

    switch (countryTax.taxType) {
      case TaxTypeEnum.GST:
        return this.indiaGst.calculate(input, taxableAmount);

      case TaxTypeEnum.VAT:
        const vatPercentage = countryTax.defaultTaxPercentage || 0;
        return this.vatService.calculate(vatPercentage, taxableAmount);

      case TaxTypeEnum.SALES_TAX:
        return this.usSalesTax.calculate(input.supplierStateCode || null, taxableAmount);

      default:
        return this.noTax(taxableAmount);
    }
  }

  private noTax(amount: number): TaxResult {
    return {
      taxType: TaxTypeEnum.NONE,
      taxPercentage: 0,
      taxAmount: 0,
      taxObj: {},
      totalAmount: amount,
    };
  }
}
