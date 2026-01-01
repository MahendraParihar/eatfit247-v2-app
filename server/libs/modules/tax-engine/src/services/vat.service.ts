import { Injectable } from '@nestjs/common';
import { TaxResult } from '../interfaces/tax.interface';
import { TaxTypeEnum } from '@eatfit247-shared-lib';

@Injectable()
export class VatService {
  calculate(vatPercentage: number, amount: number): TaxResult {
    const taxAmount = (amount * vatPercentage) / 100;

    return {
      taxType: TaxTypeEnum.VAT,
      taxPercentage: vatPercentage,
      taxAmount,
      taxObj: {
        VAT: { amount: taxAmount, taxPercentage: vatPercentage },
      },
      totalAmount: amount + taxAmount,
    };
  }
}

