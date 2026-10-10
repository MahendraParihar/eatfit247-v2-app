import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
  IAuthUser,
  ICreateCreditNote,
  ICreditNote,
  IFileModel,
  IInvoiceDocument,
  TaxTypeEnum,
  TransactionType,
} from '@eatfit247-shared-lib';
import { FranchiseDateUtil, InvoicePdfService, InvoiceSequenceService } from '@server_1/platform';
import { Transaction } from 'sequelize';
import { TxnCreditNote, TxnCreditNoteItem, TxnMemberPayment, TxnMemberProduct, TxnMemberProductOrderItem } from '../models';
import { InvoiceIssueService } from './invoice-issue.service';
import { MemberPlanService } from './member-plan.service';
import { MemberProductService } from './member-product.service';

/** Days after the event within which a UAE Tax Credit Note must be issued (Executive Regulation Art 60). */
const CREDIT_NOTE_DEADLINE_DAYS = 14;

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Tax Credit Notes (roadmap 4.6, group 10). Created against an issued tax invoice of a VAT
 * franchise; reverses VAT at the original rate and category, copies the original FX, and takes
 * the next number of the franchise's credit-note series in the same transaction. The engine is
 * generic; Indian GST credit notes are enabled in roadmap 4.9.
 */
@Injectable()
export class CreditNoteService {
  constructor(
    @InjectModel(TxnCreditNote) private readonly creditNoteRepository: typeof TxnCreditNote,
    @InjectModel(TxnMemberPayment) private readonly paymentRepository: typeof TxnMemberPayment,
    @InjectModel(TxnMemberProduct) private readonly productRepository: typeof TxnMemberProduct,
    private readonly sequelize: Sequelize,
    private readonly invoiceSequenceService: InvoiceSequenceService,
    private readonly invoiceIssueService: InvoiceIssueService,
    private readonly invoicePdfService: InvoicePdfService,
    private readonly memberPlanService: MemberPlanService,
    private readonly memberProductService: MemberProductService,
  ) {}

  public async create(memberId: number, obj: ICreateCreditNote, user: IAuthUser, ip: string): Promise<ICreditNote> {
    const amount = round2(Number(obj.amount));
    if (!(amount > 0)) {
      throw new BadRequestException('Enter an amount above zero.');
    }
    if (!obj.reason?.trim()) {
      throw new BadRequestException('A reason is required on a credit note.');
    }
    const t = await this.sequelize.transaction();
    try {
      // Lock the invoiced record so two credit notes can't over-credit it
      const where = obj.recordType === 'plan'
        ? { memberPaymentId: obj.recordId, memberId, active: true }
        : { memberProductId: obj.recordId, memberId, active: true };
      const record: TxnMemberPayment | TxnMemberProduct | null =
        obj.recordType === 'plan'
          ? await this.paymentRepository.findOne({ where, transaction: t, lock: t.LOCK.UPDATE })
          : await this.productRepository.findOne({ where, transaction: t, lock: t.LOCK.UPDATE });
      if (!record) {
        throw new NotFoundException('Invoice not found');
      }
      if (!record.invoiceId) {
        throw new BadRequestException('Only an issued invoice can be credited.');
      }
      if (user.franchiseIds?.length && !user.franchiseIds.includes(Number(record.franchiseId))) {
        throw new ForbiddenException('You do not have access to this franchise.');
      }
      const tax = await this.taxOf(record, obj.recordType, t);
      if (tax.taxType !== TaxTypeEnum.VAT) {
        throw new BadRequestException('Credit notes are available for VAT invoices; GST credit notes come with roadmap 4.9.');
      }
      const credited = Number(
        (await this.creditNoteRepository.sum('totalAmount', {
          where: obj.recordType === 'plan' ? { memberPaymentId: obj.recordId, active: true } : { memberProductId: obj.recordId, active: true },
          transaction: t,
        })) || 0,
      );
      const invoiceTotal = Number(record.totalAmount || 0);
      const remaining = round2(invoiceTotal - credited);
      if (amount > remaining) {
        throw new BadRequestException(`Only ${remaining.toFixed(2)} ${record.currency} of this invoice can still be credited.`);
      }
      // VAT reversed in proportion to the original invoice (its rate and category)
      const taxAmount = invoiceTotal > 0 ? round2((amount * Number(record.taxAmount || 0)) / invoiceTotal) : 0;
      const taxableAmount = round2(amount - taxAmount);
      const context = await this.invoiceIssueService.franchiseContext(record.franchiseId as number);
      const creditNoteDate = FranchiseDateUtil.localDate(new Date(), context.timeZone);
      const creditNoteNumber = await this.invoiceSequenceService.generateCreditNoteNumber(
        {
          franchiseId: record.franchiseId as number,
          franchiseCode: context.franchise.franchiseCode,
          fyStartMonth: Number(context.franchise.financialYear),
          invoiceDate: creditNoteDate,
        },
        t,
      );
      const fxRate = record.fxRate ? Number(record.fxRate) : null;
      const note = await this.creditNoteRepository.create(
        {
          franchiseId: record.franchiseId as number,
          memberId,
          memberPaymentId: obj.recordType === 'plan' ? obj.recordId : null,
          memberProductId: obj.recordType === 'product' ? obj.recordId : null,
          originalInvoiceId: record.invoiceId,
          originalInvoiceDate: record.invoiceDate ?? null,
          creditNoteNumber,
          creditNoteDate,
          eventDate: obj.eventDate,
          reason: obj.reason.trim(),
          currency: record.currency,
          taxableAmount,
          taxAmount,
          totalAmount: amount,
          taxType: tax.taxType,
          taxCategory: tax.taxCategory,
          taxPercentage: tax.taxPercentage,
          fxRate,
          fxRateDate: record.fxRateDate ?? null,
          fxSource: record.fxSource ?? null,
          functionalCurrency: record.functionalCurrency ?? null,
          functionalTotalAmount: fxRate ? round2(amount * fxRate) : null,
          functionalTaxAmount: fxRate ? round2(taxAmount * fxRate) : null,
          lateIssue: this.daysBetween(obj.eventDate, creditNoteDate) > CREDIT_NOTE_DEADLINE_DAYS,
          active: true,
          createdBy: user.adminId,
          modifiedBy: user.adminId,
          createdIp: ip,
          modifiedIp: ip,
        } as TxnCreditNote,
        { transaction: t },
      );
      await TxnCreditNoteItem.create(
        {
          creditNoteId: note.creditNoteId,
          description: `Credit against tax invoice ${record.invoiceId}`,
          taxableAmount,
          taxPercentage: tax.taxPercentage,
          taxAmount,
          totalAmount: amount,
          active: true,
        } as TxnCreditNoteItem,
        { transaction: t },
      );
      await t.commit();
      return this.toModel(note);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  public async list(memberId: number, user: IAuthUser): Promise<ICreditNote[]> {
    const rows = await this.creditNoteRepository.findAll({
      where: {
        memberId,
        active: true,
        ...(user.franchiseIds?.length ? { franchiseId: user.franchiseIds } : {}),
      },
      order: [['creditNoteId', 'DESC']],
    });
    return rows.map((row) => this.toModel(row));
  }

  /** PDF "TAX CREDIT NOTE": the original invoice's parties, with the credited amounts and a reference to it. */
  public async generatePdf(memberId: number, creditNoteId: number, user: IAuthUser): Promise<IFileModel> {
    const note = await this.creditNoteRepository.findOne({ where: { creditNoteId, memberId, active: true } });
    if (!note) {
      throw new NotFoundException('Credit note not found');
    }
    if (user.franchiseIds?.length && !user.franchiseIds.includes(Number(note.franchiseId))) {
      throw new ForbiddenException('You do not have access to this franchise.');
    }
    const original: IInvoiceDocument = note.memberPaymentId
      ? await this.memberPlanService.buildInvoiceDocument(memberId, note.memberPaymentId)
      : await this.memberProductService.buildInvoiceDocument(memberId, note.memberProductId as number);
    const taxLabel = original.tax.rows[0]?.label || 'VAT';
    const doc: IInvoiceDocument = {
      ...original,
      header: {
        ...original.header,
        title: 'TAX CREDIT NOTE',
        numberLabel: 'Credit Note No',
        invoiceNumber: note.creditNoteNumber,
        invoiceDate: note.creditNoteDate,
        isProforma: false,
      },
      items: [
        {
          ...(original.items[0] ?? {}),
          type: original.items[0]?.type ?? TransactionType.SERVICE,
          description: `Credit against tax invoice ${note.originalInvoiceId}`,
          qty: 1,
          unitPrice: Number(note.taxableAmount),
          amount: Number(note.taxableAmount),
          discount: 0,
          taxPercentage: Number(note.taxPercentage || 0),
          taxAmount: Number(note.taxAmount),
          totalAmount: Number(note.totalAmount),
          taxRows: undefined,
        },
      ],
      pricing: {
        subtotal: Number(note.taxableAmount),
        discount: 0,
        taxableAmount: Number(note.taxableAmount),
        taxAmount: Number(note.taxAmount),
        totalAmount: Number(note.totalAmount),
      },
      tax: {
        ...original.tax,
        rows: [{ label: taxLabel, amount: Number(note.taxAmount), percentage: Number(note.taxPercentage || 0) }],
        totalTax: Number(note.taxAmount),
        note: `Credit note against tax invoice ${note.originalInvoiceId}${
          note.originalInvoiceDate ? ` dated ${note.originalInvoiceDate}` : ''
        }. Reason: ${note.reason}`,
        lutArn: undefined,
      },
      total: { label: 'Total Credited', amount: Number(note.totalAmount) },
      fx: note.fxRate && note.functionalCurrency
        ? {
            rate: Number(note.fxRate),
            rateDate: note.fxRateDate as string,
            source: note.fxSource || '',
            fromCurrency: note.currency,
            currency: note.functionalCurrency,
            totalAmount: Number(note.functionalTotalAmount || 0),
            taxAmount: Number(note.functionalTaxAmount || 0),
          }
        : undefined,
      qrCode: undefined,
    };
    const pdfBuffer = await this.invoicePdfService.generateInvoicePdf(doc);
    return {
      filePath: '',
      fileName: `${note.creditNoteNumber.replace(/\//g, '-')}.pdf`,
      buffer: pdfBuffer.toString('base64'),
    } as IFileModel;
  }

  /** VAT type, category and rate of the invoiced record (product orders: their first line). */
  private async taxOf(
    record: TxnMemberPayment | TxnMemberProduct,
    recordType: 'plan' | 'product',
    transaction: Transaction,
  ): Promise<{ taxType: string | null; taxCategory: string | null; taxPercentage: number | null }> {
    if (recordType === 'plan') {
      const payment = record as TxnMemberPayment;
      return { taxType: payment.taxType, taxCategory: payment.taxCategory ?? null, taxPercentage: Number(payment.taxPercentage || 0) };
    }
    const line = await TxnMemberProductOrderItem.findOne({
      where: { memberProductId: (record as TxnMemberProduct).memberProductId },
      transaction,
    });
    return {
      taxType: line?.taxType ?? null,
      taxCategory: line?.taxCategory ?? null,
      taxPercentage: line ? Number(line.effectiveTaxRate || 0) : null,
    };
  }

  private daysBetween(from: string, to: string): number {
    return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
  }

  private toModel(row: TxnCreditNote): ICreditNote {
    const num = (v: number | null | undefined): number | null => (v === null || v === undefined ? null : Number(v));
    return {
      creditNoteId: row.creditNoteId,
      franchiseId: row.franchiseId,
      memberId: row.memberId,
      memberPaymentId: row.memberPaymentId,
      memberProductId: row.memberProductId,
      originalInvoiceId: row.originalInvoiceId,
      originalInvoiceDate: row.originalInvoiceDate,
      creditNoteNumber: row.creditNoteNumber,
      creditNoteDate: row.creditNoteDate,
      eventDate: row.eventDate,
      reason: row.reason,
      currency: row.currency,
      taxableAmount: Number(row.taxableAmount),
      taxAmount: Number(row.taxAmount),
      totalAmount: Number(row.totalAmount),
      taxCategory: row.taxCategory,
      taxPercentage: num(row.taxPercentage),
      lateIssue: row.lateIssue,
      fxRate: num(row.fxRate),
      fxRateDate: row.fxRateDate,
      fxSource: row.fxSource,
      functionalCurrency: row.functionalCurrency,
      functionalTotalAmount: num(row.functionalTotalAmount),
      functionalTaxAmount: num(row.functionalTaxAmount),
    };
  }
}
