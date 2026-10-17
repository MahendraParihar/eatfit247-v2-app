import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { InvoiceSequenceModel } from '../database/models';
import { BusinessTypeEnum, InvoiceNumberFormatUtil, InvoiceSeriesEnum } from '@eatfit247-shared-lib';
import { FranchiseDateUtil } from '../utils/franchise-date.util';

/** Counter type of credit notes in mst_invoice_sequences. */
export const CREDIT_NOTE_SEQUENCE_TYPE = 'credit';

export interface IInvoiceNumberRequest {
  franchiseId: number;
  franchiseCode: string;
  /** Month the franchise's financial year starts (4 = April, 1 = January) */
  fyStartMonth: number;
  invoiceType: BusinessTypeEnum;
  series: InvoiceSeriesEnum;
  /** Date of issue, `YYYY-MM-DD` in the franchise's timezone; the FY comes from it */
  invoiceDate: string;
  /** `mst_franchises.invoice_prefix`; used with `invoiceNumberFormat` */
  invoicePrefix?: string | null;
  /** `mst_franchises.invoice_number_format`; null = the legacy format */
  invoiceNumberFormat?: string | null;
  /** Indian franchise: a number that breaks Rule 46 (≤16 characters) is refused (decision 7) */
  gstLimit?: boolean;
}

export type ICreditNoteNumberRequest = Pick<
  IInvoiceNumberRequest,
  'franchiseId' | 'franchiseCode' | 'fyStartMonth' | 'invoiceDate' | 'invoicePrefix' | 'invoiceNumberFormat' | 'gstLimit'
>;

export interface IIssuedInvoiceNumber {
  invoiceId: string;
  invoiceSeries: InvoiceSeriesEnum;
  invoiceDate: string;
}

@Injectable()
export class InvoiceSequenceService {
  private readonly logger = new Logger(InvoiceSequenceService.name);

  constructor(
    @InjectModel(InvoiceSequenceModel)
    private readonly invoiceSequenceModel: typeof InvoiceSequenceModel,
  ) {}

  /**
   * Next gap-free invoice number for (franchise, type, FY, series), inside the caller's transaction.
   * The counter row is created on first use and locked FOR UPDATE until the caller commits.
   *
   * With a franchise template (compliant invoice numbering) the number is rendered from it, e.g.
   * `EFM/2627/S/00492`; the counter key and value are the same, so the sequence continues.
   * Without one (legacy, e.g. HCUAE): DOMESTIC `{code}/{FY}/{S|P}/{000001}`,
   * EXPORT `{code}/EXP/{FY}/{S|P}/{000001}`.
   */
  async generateInvoiceNumber(request: IInvoiceNumberRequest, trx: Transaction): Promise<IIssuedInvoiceNumber> {
    const fy = FranchiseDateUtil.financialYear(request.invoiceDate, request.fyStartMonth);
    const invoiceId = await this.nextNumber(request, request.invoiceType, request.series, fy, trx, (next) => {
      if (this.hasTemplate(request)) {
        return this.renderTemplated(request, InvoiceNumberFormatUtil.typeLetter(request.invoiceType, request.series), next);
      }
      const typeCode = request.invoiceType === BusinessTypeEnum.PRODUCT ? 'P' : 'S';
      const seriesPart = request.series === InvoiceSeriesEnum.EXPORT ? 'EXP/' : '';
      return `${request.franchiseCode}/${seriesPart}${fy}/${typeCode}/${String(next).padStart(6, '0')}`;
    });
    return {
      invoiceId,
      invoiceSeries: request.series,
      invoiceDate: request.invoiceDate,
    };
  }

  /**
   * Next gap-free credit-note number for (franchise, FY), inside the caller's transaction (counter
   * rows with invoice_type 'credit'): from the franchise template with type `C` (decision 8), else
   * the legacy `{code}/{FY}/CN/{000001}`.
   */
  async generateCreditNoteNumber(request: ICreditNoteNumberRequest, trx: Transaction): Promise<string> {
    const fy = FranchiseDateUtil.financialYear(request.invoiceDate, request.fyStartMonth);
    return this.nextNumber(request, CREDIT_NOTE_SEQUENCE_TYPE, InvoiceSeriesEnum.DOMESTIC, fy, trx, (next) =>
      this.hasTemplate(request)
        ? this.renderTemplated(request, InvoiceNumberFormatUtil.typeLetter(BusinessTypeEnum.SERVICE, InvoiceSeriesEnum.DOMESTIC, true), next)
        : `${request.franchiseCode}/${fy}/CN/${String(next).padStart(6, '0')}`,
    );
  }

  /**
   * Locks (creating on first use) the counter row, renders the next number and only then saves the
   * counter. The Rule 46 guard (decision 7) runs before the save, so a refused number is never
   * consumed even if a caller commits after catching the error.
   */
  private async nextNumber(
    request: ICreditNoteNumberRequest,
    invoiceType: string,
    series: InvoiceSeriesEnum,
    fy: string,
    trx: Transaction,
    render: (next: number) => string,
  ): Promise<string> {
    const [sequence] = await this.invoiceSequenceModel.findOrCreate({
      where: {
        franchiseId: request.franchiseId,
        invoiceType,
        financialYear: fy,
        series,
      },
      defaults: { currentNumber: 0 },
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    const next = sequence.currentNumber + 1;
    const number = render(next);
    if (request.gstLimit && this.hasTemplate(request) && !InvoiceNumberFormatUtil.isRule46Compliant(number)) {
      this.logger.error(
        `Refused invoice number ${number} for franchise ${request.franchiseId}: it breaks Rule 46 (at most 16 characters, ` +
          `letters, digits, / and -). Fix the franchise's invoice number format.`,
      );
      throw new BadRequestException(
        `The invoice number ${number} breaks the GST limit of 16 characters. Ask an admin to fix the franchise's invoice number format.`,
      );
    }
    sequence.currentNumber = next;
    await sequence.save({ transaction: trx });
    return number;
  }

  private hasTemplate(request: ICreditNoteNumberRequest): boolean {
    return !!request.invoiceNumberFormat?.trim() && !!request.invoicePrefix?.trim();
  }

  private renderTemplated(request: ICreditNoteNumberRequest, typeLetter: string, sequence: number): string {
    return InvoiceNumberFormatUtil.render({
      template: (request.invoiceNumberFormat as string).trim(),
      prefix: (request.invoicePrefix as string).trim(),
      fyStartMonth: request.fyStartMonth,
      invoiceDate: request.invoiceDate,
      typeLetter,
      sequence,
    });
  }
}
