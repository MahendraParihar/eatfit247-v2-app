import { Injectable } from '@nestjs/common';
import { TaxInput, TaxResult } from '../interfaces/tax.interface';
import { TaxMode, TaxTypeEnum } from '@eatfit247-shared-lib';

@Injectable()
export class IndiaGstService {
  calculate(input: TaxInput, amount: number, gstPercentage: number): TaxResult {
    const taxAmount = (amount * gstPercentage) / 100;
    const taxObj: Record<string, { amount: number; taxPercentage: number }> = {};
    // Supplier & customer must be in India here
    // Same state → CGST + SGST
    if (
      input.customerStateCode &&
      input.supplierStateCode &&
      input.customerStateCode === input.supplierStateCode
    ) {
      taxObj['CGST'] = {
        amount: taxAmount / 2,
        taxPercentage: gstPercentage / 2,
      };
      taxObj['SGST'] = {
        amount: taxAmount / 2,
        taxPercentage: gstPercentage / 2,
      };
    }
    // Different states → IGST
    else {
      taxObj['IGST'] = {
        amount: taxAmount,
        taxPercentage: gstPercentage,
      };
    }
    return {
      taxType: TaxTypeEnum.GST,
      taxPercentage: gstPercentage,
      taxAmount,
      taxObj,
      totalAmount: amount + taxAmount,
      taxMode: TaxMode.DOMESTIC_GST,
      isLutApplied: false,
      entityCountry: '',
      placeOfSupply: '',
      customerCountry: '',
    };
  }
}
