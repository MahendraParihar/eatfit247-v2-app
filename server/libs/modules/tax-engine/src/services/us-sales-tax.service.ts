import { Injectable } from '@nestjs/common';
import { TaxResult } from '../interfaces/tax.interface';
import { StateService } from '@server/common';
import { TaxTypeEnum } from 'eatfit247-shared-lib';

@Injectable()
export class UsSalesTaxService {
  constructor(private readonly stateService: StateService) {}

  async calculate(stateCode: string | null, amount: number): Promise<TaxResult> {
    if (!stateCode) {
      return this.noTax(amount);
    }

    // Find state by code
    const states = await this.stateService.findAll({ page: 0, limit: 1, search: stateCode });
    const state = states.tableData.find((s) => s.code === stateCode);

    if (!state || !state.taxPercentage || state.taxPercentage === 0) {
      return this.noTax(amount);
    }

    const taxAmount = (amount * state.taxPercentage) / 100;

    return {
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
    };
  }

  private noTax(amount: number): TaxResult {
    return {
      taxType: TaxTypeEnum.SALES_TAX,
      taxPercentage: 0,
      taxAmount: 0,
      taxObj: {},
      totalAmount: amount,
    };
  }
}
