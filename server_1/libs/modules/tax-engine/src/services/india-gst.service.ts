import { Injectable } from '@nestjs/common';
import { TaxInput, TaxResult } from '../interfaces/tax.interface';
import { TaxMode, TaxTypeEnum } from '@eatfit247-shared-lib';

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

@Injectable()
export class IndiaGstService {
  calculate(input: TaxInput, amount: number, gstPercentage: number): TaxResult {
    // One rounding policy (audit M3): tax to 2 dp; CGST = round(tax / 2); SGST = the rest, so the
    // two halves always add up to the printed total.
    const taxAmount = round2((amount * gstPercentage) / 100);
    const taxObj: Record<string, { amount: number; taxPercentage: number }> = {};
    // Supplier & customer must be in India here
    // Same state → CGST + SGST
    if (
      input.customerStateCode &&
      input.supplierStateCode &&
      input.customerStateCode === input.supplierStateCode
    ) {
      const cgst = round2(taxAmount / 2);
      taxObj['CGST'] = {
        amount: cgst,
        taxPercentage: gstPercentage / 2,
      };
      taxObj['SGST'] = {
        amount: round2(taxAmount - cgst),
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
      discount: input.discountAmount,
      baseAmount: amount,
      taxType: TaxTypeEnum.GST,
      taxPercentage: gstPercentage,
      taxAmount,
      taxObj,
      totalAmount: round2(amount + taxAmount),
      taxMode: TaxMode.DOMESTIC_GST,
      isLutApplied: false,
      entityCountry: '',
      placeOfSupply: '',
      customerCountry: '',
    };
  }
}
