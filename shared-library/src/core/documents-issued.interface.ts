/** GSTR-1 Table 13 nature of document, as the GST portal names it. */
export enum DocumentNatureEnum {
  INVOICES_FOR_OUTWARD_SUPPLY = 'Invoices for outward supply',
  CREDIT_NOTE = 'Credit Note',
}

/** One series of documents issued in the period (compliant invoice numbering, decision 13). */
export interface IDocumentsIssuedRow {
  natureOfDocument: DocumentNatureEnum;
  /** The number without its trailing digit run, e.g. `EFM/2627/S/` */
  seriesKey: string;
  /** Sr. No. From / To: the lowest and highest number issued in the period */
  fromNumber: string;
  toNumber: string;
  /** Total number: every issued number, cancelled included */
  totalIssued: number;
  /** Issued numbers whose row is now inactive (soft-deleted); refunds are corrected by credit notes */
  cancelled: number;
  netIssued: number;
  /** Numbers between From and To that were never issued in the period (audit flag; should be empty) */
  missingNumbers: string[];
  /** More missing numbers than listed */
  missingTruncated: boolean;
  /**
   * Pre-FY 2026-27 numbering (e.g. `EF24B7…`), whose counter can't be read from the number:
   * one row per nature, From / To by number, no gap check; check by hand
   */
  legacy: boolean;
}

export interface IDocumentsIssuedReport {
  franchiseId: number;
  franchiseCode: string;
  companyName: string;
  /** Period, inclusive, `YYYY-MM-DD` */
  from: string;
  to: string;
  /** False for a franchise without a GSTIN: "not a tax invoice; not reported" */
  reportable: boolean;
  rows: IDocumentsIssuedRow[];
}
