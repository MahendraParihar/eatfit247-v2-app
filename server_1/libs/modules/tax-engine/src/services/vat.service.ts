import { Injectable } from '@nestjs/common';
import { TaxResult } from '../interfaces/tax.interface';
import { TaxTypeEnum } from '@eatfit247-shared-lib';

@Injectable()
@Injectable()
export class VatService {
  calculate(vatPercentage: number, amount: number): TaxResult {
    const taxAmount = Number(((amount * vatPercentage) / 100).toFixed(2));
    return {
      discount: 0,
      baseAmount: amount,
      taxType: TaxTypeEnum.VAT,
      taxPercentage: vatPercentage,
      taxAmount,
      taxObj: {
        VAT: {
          amount: taxAmount,
          taxPercentage: vatPercentage,
        },
      },
      totalAmount: amount + taxAmount,
      isLutApplied: false,
      entityCountry: '',
      placeOfSupply: '',
      customerCountry: '',
    };
  }
}

