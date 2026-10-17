import { BadRequestException, Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import {
  DocumentNatureEnum,
  IAuthUser,
  IDocumentsIssuedReport,
  IDocumentsIssuedRow,
  PaymentStatusEnum,
} from '@eatfit247-shared-lib';
import { FranchiseDateUtil } from '@server_1/platform';
import { FinancialYearService } from './financial-year.service';
import { DocumentSeriesUtil } from '../utils/document-series.util';

/** One issued number read for the report. */
export interface IIssuedDocument {
  nature: DocumentNatureEnum;
  number: string;
  /** The row is now inactive or no longer PAID (decision 9 of 4.7: the number stays issued) */
  cancelled: boolean;
}

/** Longest period the report accepts (a quarter is the normal maximum; a year allows an annual check). */
const MAX_PERIOD_DAYS = 366;
/** Missing numbers listed per row; the rest is flagged as truncated. */
export const MAX_MISSING_LISTED = 50;

const NATURE_ORDER: DocumentNatureEnum[] = [DocumentNatureEnum.INVOICES_FOR_OUTWARD_SUPPLY, DocumentNatureEnum.CREDIT_NOTE];

/**
 * GSTR-1 Table 13 "Documents issued" (compliant invoice numbering, decision 13): per franchise and
 * filing period, one row per series with from / to, total issued, cancelled and net issued, and a gap
 * check. Plan payments and product orders are dated by `invoice_date` (else their payment date, for
 * rows issued before migration 137); credit notes by `credit_note_date`.
 */
@Injectable()
export class DocumentsIssuedService {
  constructor(
    private readonly financialYearService: FinancialYearService,
    private readonly sequelize: Sequelize,
  ) {}

  async report(user: IAuthUser, franchiseId: number, from: string, to: string): Promise<IDocumentsIssuedReport> {
    DocumentsIssuedService.assertPeriod(from, to);
    // Throws 403 when a franchise-scoped admin asks for another franchise
    const franchise = await this.financialYearService.resolveFranchise(user, franchiseId);
    const documents = await this.issuedDocuments(
      franchise.franchiseId,
      from,
      to,
      franchise.timeZone || FranchiseDateUtil.DEFAULT_TIME_ZONE,
    );
    return {
      franchiseId: franchise.franchiseId,
      franchiseCode: franchise.franchiseCode,
      companyName: franchise.companyName,
      from,
      to,
      reportable: !!(franchise.gstNumber || '').trim(),
      rows: DocumentsIssuedService.buildRows(documents),
    };
  }

  /** CSV with the portal's columns, then the gap check. */
  static toCsv(report: IDocumentsIssuedReport): string {
    const escape = (value: string | number): string => {
      const text = String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const header = ['Nature of document', 'Sr. No. From', 'Sr. No. To', 'Total number', 'Cancelled', 'Net issued', 'Missing numbers'];
    const lines = report.rows.map((row) =>
      [
        row.natureOfDocument,
        row.fromNumber,
        row.toNumber,
        row.totalIssued,
        row.cancelled,
        row.netIssued,
        row.missingNumbers.join(' ') + (row.missingTruncated ? ' …' : ''),
      ]
        .map(escape)
        .join(','),
    );
    return [header.map(escape).join(','), ...lines].join('\r\n') + '\r\n';
  }

  /** Groups numbers by nature and series; from / to are the lowest and highest counter in the period. */
  static buildRows(documents: IIssuedDocument[]): IDocumentsIssuedRow[] {
    const groups = new Map<string, { nature: DocumentNatureEnum; seriesKey: string; items: Array<IIssuedDocument & { sequence: number | null; width: number }> }>();
    for (const document of documents) {
      const parts = DocumentSeriesUtil.split(document.number);
      // A number without a trailing counter is its own series
      const seriesKey = parts.sequence === null ? document.number : parts.seriesKey;
      const key = `${document.nature}\u0000${seriesKey}`;
      if (!groups.has(key)) {
        groups.set(key, { nature: document.nature, seriesKey, items: [] });
      }
      groups.get(key)?.items.push({ ...document, sequence: parts.sequence, width: parts.width });
    }

    const rows: IDocumentsIssuedRow[] = [];
    for (const group of groups.values()) {
      const items = [...group.items].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0) || a.number.localeCompare(b.number));
      const first = items[0];
      const last = items[items.length - 1];
      const cancelled = items.filter((item) => item.cancelled).length;
      const missingNumbers: string[] = [];
      let missingTruncated = false;
      if (first.sequence !== null && last.sequence !== null) {
        const present = new Set(items.map((item) => item.sequence));
        for (let sequence = first.sequence + 1; sequence < last.sequence; sequence++) {
          if (!present.has(sequence)) {
            if (missingNumbers.length === MAX_MISSING_LISTED) {
              missingTruncated = true;
              break;
            }
            missingNumbers.push(DocumentSeriesUtil.join(group.seriesKey, sequence, first.width));
          }
        }
      }
      rows.push({
        natureOfDocument: group.nature,
        seriesKey: group.seriesKey,
        fromNumber: first.number,
        toNumber: last.number,
        totalIssued: items.length,
        cancelled,
        netIssued: items.length - cancelled,
        missingNumbers,
        missingTruncated,
      });
    }
    return rows.sort(
      (a, b) =>
        NATURE_ORDER.indexOf(a.natureOfDocument) - NATURE_ORDER.indexOf(b.natureOfDocument) ||
        a.seriesKey.localeCompare(b.seriesKey) ||
        a.fromNumber.localeCompare(b.fromNumber),
    );
  }

  static assertPeriod(from: string, to: string): void {
    const start = Date.parse(`${from}T00:00:00Z`);
    const end = Date.parse(`${to}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || Number.isNaN(start) || Number.isNaN(end)) {
      throw new BadRequestException('Period dates must be YYYY-MM-DD.');
    }
    if (end < start) {
      throw new BadRequestException('The period ends before it starts.');
    }
    if ((end - start) / 86_400_000 + 1 > MAX_PERIOD_DAYS) {
      throw new BadRequestException(`The period can cover at most ${MAX_PERIOD_DAYS} days.`);
    }
  }

  /** Every number of the franchise issued in the period, from all three document tables. */
  private async issuedDocuments(franchiseId: number, from: string, to: string, timeZone: string): Promise<IIssuedDocument[]> {
    const rows = await this.sequelize.query<{ kind: 'INVOICE' | 'CREDIT_NOTE'; number: string; cancelled: boolean }>(
      `SELECT 'INVOICE' AS kind, p.invoice_id AS number,
              (p.active = false OR p.payment_status_id <> :paid) AS cancelled
       FROM public.txn_member_payments p
       WHERE p.franchise_id = :franchiseId
         AND p.invoice_id IS NOT NULL
         AND COALESCE(p.invoice_date, p.payment_date) BETWEEN CAST(:from AS DATE) AND CAST(:to AS DATE)
       UNION ALL
       SELECT 'INVOICE', m.invoice_id,
              (m.active = false OR m.payment_status_id <> :paid)
       FROM public.txn_member_products m
       WHERE m.franchise_id = :franchiseId
         AND m.invoice_id IS NOT NULL
         AND COALESCE(m.invoice_date, (m.payment_date AT TIME ZONE :timeZone)::date) BETWEEN CAST(:from AS DATE) AND CAST(:to AS DATE)
       UNION ALL
       SELECT 'CREDIT_NOTE', c.credit_note_number, (c.active = false)
       FROM public.txn_credit_notes c
       WHERE c.franchise_id = :franchiseId
         AND c.credit_note_date BETWEEN CAST(:from AS DATE) AND CAST(:to AS DATE)`,
      {
        type: QueryTypes.SELECT,
        replacements: { franchiseId, from, to, timeZone, paid: PaymentStatusEnum.PAID },
      },
    );
    return rows.map((row) => ({
      nature: row.kind === 'CREDIT_NOTE' ? DocumentNatureEnum.CREDIT_NOTE : DocumentNatureEnum.INVOICES_FOR_OUTWARD_SUPPLY,
      number: row.number,
      cancelled: !!row.cancelled,
    }));
  }
}
