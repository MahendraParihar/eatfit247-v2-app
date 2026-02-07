import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { InvoiceSequenceModel } from '../database/models';
import { BusinessTypeEnum } from '@eatfit247-shared-lib';

@Injectable()
export class InvoiceSequenceService {
  constructor(
    @InjectModel(InvoiceSequenceModel)
    private readonly invoiceSequenceModel: typeof InvoiceSequenceModel,
  ) {}

  /**
   * Generate a unique invoice number based on entity, invoice type, and financial year
   * @param franchiseId
   * @param startMonth
   * @param franchiseCode
   * @param invoiceType - Type of invoice: 'PRODUCT' or 'SERVICE'
   * @param trx - Database transaction
   * @returns Generated invoice number in format: {entityCode}/{financialYear}/{typeCode}/{sequenceNumber}
   */
  async generateInvoiceNumber(
    franchiseId: number,
    startMonth: number,
    franchiseCode: string,
    invoiceType: BusinessTypeEnum,
    trx: Transaction,
  ) {
    const fy = this.getFinancialYear(new Date(), startMonth);
    const [sequence] = await this.invoiceSequenceModel.findOrCreate({
      where: {
        franchiseId: franchiseId,
        invoiceType,
        financialYear: fy,
      },
      defaults: { currentNumber: 0 },
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    sequence.currentNumber += 1;
    await sequence.save({ transaction: trx });
    const typeCode = invoiceType === BusinessTypeEnum.PRODUCT ? 'P' : 'S';
    return `${franchiseCode}/${fy}/${typeCode}/${String(sequence.currentNumber).padStart(6, '0')}`;
  }

  private getFinancialYear(date: Date, fyStartMonth: number) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    if (month >= fyStartMonth) {
      return fyStartMonth === 1 ? `${year}` : `${year}-${String(year + 1).slice(-2)}`;
    } else {
      return fyStartMonth === 1 ? `${year - 1}` : `${year - 1}-${String(year).slice(-2)}`;
    }
  }
}

