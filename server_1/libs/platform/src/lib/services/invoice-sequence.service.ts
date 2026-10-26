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
   * @param invoiceDate - Optional invoice date (YYYY-MM-DD). The FY comes from it when given,
   *   otherwise from today. Workshop invoices pass it; member and product invoices don't.
   * @returns Generated invoice number in format: {entityCode}/{financialYear}/{typeCode}/{sequenceNumber}
   */
  async generateInvoiceNumber(
    franchiseId: number,
    startMonth: number,
    franchiseCode: string,
    invoiceType: BusinessTypeEnum,
    trx: Transaction,
    invoiceDate?: string,
  ) {
    const fy = this.getFinancialYear(
      invoiceDate ? this.parseDateOnly(invoiceDate) : new Date(),
      startMonth,
    );
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

  /**
   * The FY label ("2026-27", or "2026" for a January start) that a date falls into.
   * @param date - A Date, or a YYYY-MM-DD string
   * @param fyStartMonth - The franchise's FY start month
   */
  financialYearFor(date: Date | string, fyStartMonth: number): string {
    return this.getFinancialYear(typeof date === 'string' ? this.parseDateOnly(date) : date, fyStartMonth);
  }

  /**
   * YYYY-MM-DD as a local date. `new Date('2026-04-01')` is UTC midnight, which is
   * 31 Mar in a negative-offset timezone and would pick the wrong FY.
   */
  private parseDateOnly(value: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) {
      throw new Error(`Invalid invoice date: ${value}`);
    }
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
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

