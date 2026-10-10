import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { InvoiceSequenceModel } from '../database/models';
import { BusinessTypeEnum, InvoiceSeriesEnum } from '@eatfit247-shared-lib';
import { FranchiseDateUtil } from '../utils/franchise-date.util';

export interface IInvoiceNumberRequest {
  franchiseId: number;
  franchiseCode: string;
  /** Month the franchise's financial year starts (4 = April, 1 = January) */
  fyStartMonth: number;
  invoiceType: BusinessTypeEnum;
  series: InvoiceSeriesEnum;
  /** Date of issue, `YYYY-MM-DD` in the franchise's timezone; the FY comes from it */
  invoiceDate: string;
}

export interface IIssuedInvoiceNumber {
  invoiceId: string;
  invoiceSeries: InvoiceSeriesEnum;
  invoiceDate: string;
}

@Injectable()
export class InvoiceSequenceService {
  constructor(
    @InjectModel(InvoiceSequenceModel)
    private readonly invoiceSequenceModel: typeof InvoiceSequenceModel,
  ) {}

  /**
   * Next gap-free invoice number for (franchise, type, FY, series), inside the caller's transaction.
   * The counter row is created on first use and locked FOR UPDATE until the caller commits.
   *
   * Formats: DOMESTIC `{code}/{FY}/{S|P}/{000001}`, EXPORT `{code}/EXP/{FY}/{S|P}/{000001}`.
   */
  async generateInvoiceNumber(request: IInvoiceNumberRequest, trx: Transaction): Promise<IIssuedInvoiceNumber> {
    const fy = FranchiseDateUtil.financialYear(request.invoiceDate, request.fyStartMonth);
    const [sequence] = await this.invoiceSequenceModel.findOrCreate({
      where: {
        franchiseId: request.franchiseId,
        invoiceType: request.invoiceType,
        financialYear: fy,
        series: request.series,
      },
      defaults: { currentNumber: 0 },
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    sequence.currentNumber += 1;
    await sequence.save({ transaction: trx });
    const typeCode = request.invoiceType === BusinessTypeEnum.PRODUCT ? 'P' : 'S';
    const seriesPart = request.series === InvoiceSeriesEnum.EXPORT ? 'EXP/' : '';
    const sequenceNumber = String(sequence.currentNumber).padStart(6, '0');
    return {
      invoiceId: `${request.franchiseCode}/${seriesPart}${fy}/${typeCode}/${sequenceNumber}`,
      invoiceSeries: request.series,
      invoiceDate: request.invoiceDate,
    };
  }
}
