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
  /** Issued numbers whose row is now inactive or no longer PAID */
  cancelled: number;
  netIssued: number;
  /** Numbers between From and To that were never issued in the period (audit flag; should be empty) */
  missingNumbers: string[];
  /** More missing numbers than listed */
  missingTruncated: boolean;
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
