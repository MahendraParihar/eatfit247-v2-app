import { Injectable } from '@nestjs/common';
import { TaxResult } from '../interfaces/tax.interface';
import { StateService } from '@server_1/platform';
import { TaxTypeEnum } from '@eatfit247-shared-lib';

@Injectable()
export class UsSalesTaxService {
  constructor(private readonly stateService: StateService) {}

  async calculate(stateCode: string | null, amount: number): Promise<TaxResult> {
    if (!stateCode) {
      return this.noTax(amount);
    }
    const state = await this.stateService.findByCode(stateCode);
    if (!state || !state.taxPercentage || state.taxPercentage === 0) {
      return this.noTax(amount);
    }
    const taxAmount = Number(((amount * state.taxPercentage) / 100).toFixed(2));
    return {
      discount: 0,
      baseAmount: amount,
      taxType: TaxTypeEnum.SALES_TAX,
      taxPercentage: state.taxPercentage,
      taxAmount,
      taxObj: {
        SALES_TAX: {
          amount: taxAmount,
          taxPercentage: state.taxPercentage,
        },
      },
      totalAmount: amount + taxAmount,
      isLutApplied: false,
      entityCountry: '',
      placeOfSupply: '',
      customerCountry: '',
    };
  }

  private noTax(amount: number): TaxResult {
    return {
      discount: 0,
      baseAmount: amount,
      taxType: TaxTypeEnum.NONE,
      taxPercentage: 0,
      taxAmount: 0,
      taxObj: {},
      totalAmount: amount,
      isLutApplied: false,
      entityCountry: '',
      placeOfSupply: '',
      customerCountry: '',
    };
  }
}


