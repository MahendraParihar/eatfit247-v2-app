import { Injectable } from '@nestjs/common';
import { TaxInput, TaxResult } from '../interfaces/tax.interface';
import { TaxTypeEnum } from 'eatfit247-shared-lib';

@Injectable()
export class IndiaGstService {
  private readonly GST_PERCENTAGE = 18;

  calculate(input: TaxInput, amount: number): TaxResult {
    const taxAmount = (amount * this.GST_PERCENTAGE) / 100;
    const taxObj: Record<string, { amount: number; taxPercentage: number }> = {};

    // If customer is not from India, apply IGST
    if (input.customerCountryCode !== 'IN') {
      taxObj.IGST = { amount: taxAmount, taxPercentage: this.GST_PERCENTAGE };
    }
    // If both supplier and customer are from India
    else if (input.customerCountryCode === 'IN' && input.supplierCountryCode === 'IN') {
      // Same state - CGST + SGST
      if (
        input.customerStateCode &&
        input.supplierStateCode &&
        input.customerStateCode === input.supplierStateCode
      ) {
        taxObj.CGST = { amount: taxAmount / 2, taxPercentage: this.GST_PERCENTAGE / 2 };
        taxObj.SGST = { amount: taxAmount / 2, taxPercentage: this.GST_PERCENTAGE / 2 };
      }
      // Different states - IGST
      else {
        taxObj.IGST = { amount: taxAmount, taxPercentage: this.GST_PERCENTAGE };
      }
    }
    // International - IGST
    else {
      taxObj.IGST = { amount: taxAmount, taxPercentage: this.GST_PERCENTAGE };
    }

    return {
      taxType: TaxTypeEnum.GST,
      taxPercentage: this.GST_PERCENTAGE,
      taxAmount,
      taxObj,
      totalAmount: amount + taxAmount,
    };
  }
}
