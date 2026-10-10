import { Sequelize } from 'sequelize-typescript';
import { InvoicePdfService, InvoiceSequenceService } from '@server_1/platform';
import { TaxTypeEnum } from '@eatfit247-shared-lib';
import { TxnCreditNote, TxnCreditNoteItem, TxnMemberPayment, TxnMemberProduct } from '../models';
import { CreditNoteService } from '../services/credit-note.service';
import { InvoiceIssueService } from '../services/invoice-issue.service';
import { MemberPlanService } from '../services/member-plan.service';
import { MemberProductService } from '../services/member-product.service';

/** Roadmap 4.6 group 10: Tax Credit Notes (validation A19, A20). */
describe('CreditNoteService', () => {
  let transaction: { LOCK: { UPDATE: string }; commit: jest.Mock; rollback: jest.Mock };
  let invoice: Record<string, unknown> | null;
  let alreadyCredited: number;
  let alreadyReversed: number;
  let created: Record<string, unknown> | null;
  let generateCreditNoteNumber: jest.Mock;
  let service: CreditNoteService;
  const user = { adminId: 1, franchiseIds: [] } as never;

  beforeEach(() => {
    transaction = { LOCK: { UPDATE: 'UPDATE' }, commit: jest.fn(), rollback: jest.fn() };
    invoice = {
      memberPaymentId: 77,
      memberId: 5888,
      franchiseId: 2,
      invoiceId: 'HCUAE/2026/S/000005',
      invoiceDate: '2026-10-01',
      currency: 'AED',
      totalAmount: '1050.00',
      taxAmount: '50.00',
      taxType: TaxTypeEnum.VAT,
      taxCategory: 'STANDARD',
      taxPercentage: '5.00',
      fxRate: null,
    };
    alreadyCredited = 0;
    alreadyReversed = 0;
    created = null;
    generateCreditNoteNumber = jest.fn().mockResolvedValue('HCUAE/2026/CN/000001');
    jest.spyOn(TxnCreditNoteItem, 'create').mockResolvedValue({} as TxnCreditNoteItem);
    service = new CreditNoteService(
      {
        sum: jest.fn().mockImplementation(async (field: string) => (field === 'taxAmount' ? alreadyReversed : alreadyCredited)),
        create: jest.fn().mockImplementation(async (row: Record<string, unknown>) => {
          created = { creditNoteId: 9, ...row };
          return created;
        }),
      } as unknown as typeof TxnCreditNote,
      { findOne: jest.fn().mockImplementation(async () => invoice) } as unknown as typeof TxnMemberPayment,
      { findOne: jest.fn() } as unknown as typeof TxnMemberProduct,
      { transaction: jest.fn().mockResolvedValue(transaction) } as unknown as Sequelize,
      { generateCreditNoteNumber } as unknown as InvoiceSequenceService,
      {
        franchiseContext: jest.fn().mockResolvedValue({
          franchise: { franchiseCode: 'HCUAE', financialYear: 1 },
          countryCode: 'AE',
          timeZone: 'Asia/Dubai',
        }),
      } as unknown as InvoiceIssueService,
      {} as InvoicePdfService,
      {} as MemberPlanService,
      {} as MemberProductService,
    );
  });

  const credit = (overrides: Record<string, unknown> = {}) =>
    service.create(
      5888,
      { recordType: 'plan', recordId: 77, amount: 525, reason: 'Programme shortened', eventDate: '2026-10-05', ...overrides } as never,
      user,
      '127.0.0.1',
    );

  it('A19 credits part of a VAT invoice, reversing VAT at the original rate, numbered in the transaction', async () => {
    const note = await credit();
    expect(note).toMatchObject({ creditNoteNumber: 'HCUAE/2026/CN/000001', totalAmount: 525, taxAmount: 25, taxableAmount: 500, taxCategory: 'STANDARD' });
    expect(generateCreditNoteNumber).toHaveBeenCalledWith(
      expect.objectContaining({ franchiseId: 2, franchiseCode: 'HCUAE', fyStartMonth: 1 }),
      transaction,
    );
    expect(created).toMatchObject({ originalInvoiceId: 'HCUAE/2026/S/000005', originalInvoiceDate: '2026-10-01', lateIssue: false });
    expect(transaction.commit).toHaveBeenCalled();
  });

  it('A19 refuses more than what is still creditable, and consumes no number', async () => {
    alreadyCredited = 800;
    await expect(credit({ amount: 300 })).rejects.toThrow('Only 250.00 AED of this invoice can still be credited.');
    expect(generateCreditNoteNumber).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalled();
  });

  it('A19 refuses GST invoices (4.9) and unissued records', async () => {
    invoice = { ...invoice, taxType: TaxTypeEnum.GST };
    await expect(credit()).rejects.toThrow('roadmap 4.9');
    invoice = { ...invoice, taxType: TaxTypeEnum.VAT, invoiceId: null };
    await expect(credit()).rejects.toThrow('Only an issued invoice');
  });

  it('flags a note issued more than 14 days after the event', async () => {
    await credit({ eventDate: '2026-09-01' });
    expect(created).toMatchObject({ lateIssue: true });
  });

  it("refuses an admin scoped to another franchise", async () => {
    await expect(
      service.create(5888, { recordType: 'plan', recordId: 77, amount: 10, reason: 'x', eventDate: '2026-10-05' }, { adminId: 9, franchiseIds: [1] } as never, 'ip'),
    ).rejects.toThrow('access to this franchise');
  });

  it('partial credits never reverse more VAT than the invoice charged (cumulative rounding)', async () => {
    invoice = { ...invoice, totalAmount: '105.00', taxAmount: '5.00' };
    const vat: number[] = [];
    for (let i = 0; i < 3; i += 1) {
      const note = await credit({ amount: 35 });
      vat.push(note.taxAmount);
      alreadyCredited += 35;
      alreadyReversed += note.taxAmount;
    }
    expect(vat.reduce((a, b) => a + b, 0)).toBeCloseTo(5, 2);
  });
});

