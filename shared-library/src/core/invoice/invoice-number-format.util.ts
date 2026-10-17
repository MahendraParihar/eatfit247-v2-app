import { BusinessTypeEnum, InvoiceSeriesEnum } from '../../enum';
import { FinancialYearUtil } from '../../utils/financial-year.util';

/**
 * CGST Rule 46(b) / Rule 53(1A)(c) and e-invoice schema `DocDtls.No`: at most 16 characters,
 * letters, digits, `/` and `-`, not starting with `0`, `/` or `-`.
 */
export const RULE46_INVOICE_NUMBER = /^[A-Za-z1-9][A-Za-z0-9\/-]{0,15}$/;

/** `mst_franchises.invoice_prefix` (same rule as the DB CHECK). */
export const INVOICE_PREFIX_PATTERN = /^[A-Z0-9]{1,5}$/;

/** `mst_franchises.invoice_number_format` column length. */
export const INVOICE_NUMBER_FORMAT_MAX_LENGTH = 40;

/** Country whose invoices are held to Rule 46 (16 characters). */
export const INDIA_COUNTRY_CODE = 'IN';

/** `mst_invoice_sequences.invoice_type` of credit-note counters. */
export const CREDIT_NOTE_SEQUENCE_TYPE = 'credit';

export const INVOICE_SEQUENCE_MIN_DIGITS = 3;
export const INVOICE_SEQUENCE_MAX_DIGITS = 8;

/** One letter per document type and series; each letter is its own Rule 46 series and GSTR-1 Table 13 row. */
export enum InvoiceTypeLetter {
  DOMESTIC_SERVICE = 'S',
  EXPORT_SERVICE = 'E',
  DOMESTIC_PRODUCT = 'P',
  EXPORT_PRODUCT = 'X',
  CREDIT_NOTE = 'C',
}

export interface IInvoiceNumberRenderInput {
  /** e.g. `{PREFIX}/{FY}/{TYPE}/{SEQ5}` */
  template: string;
  prefix: string;
  /** Month the franchise's financial year starts (4 = April, 1 = January) */
  fyStartMonth: number;
  /** Date of issue, `YYYY-MM-DD` in the franchise's timezone; the FY comes from it */
  invoiceDate: string;
  typeLetter: InvoiceTypeLetter | string;
  sequence: number;
}

export interface IInvoiceNumberValidateOptions {
  /** Indian franchise: every possible number must satisfy Rule 46 (≤16 characters) */
  gstLimit: boolean;
}

const BRACE_GROUP = /\{[^{}]*\}/g;
const FIXED_TOKENS = ['PREFIX', 'FY', 'TYPE'];
const SEQ_TOKEN = /^SEQ(\d+)$/;
const RENDER_TOKEN = /\{(PREFIX|FY|TYPE|SEQ(\d+))\}/g;
const ALL_TYPE_LETTERS = Object.values(InvoiceTypeLetter);

/**
 * Per-franchise invoice number format (compliant invoice numbering, decisions 2–6).
 * Tokens: `{PREFIX}`, `{FY}` (`2627` for an April start, `2026` for a January start),
 * `{TYPE}` (one letter, see {@link InvoiceTypeLetter}) and `{SEQn}` (the counter, zero-padded to n
 * digits, n from 3 to 8). Literal separators may only be `/` and `-`. The template starts with
 * `{PREFIX}` and a separator, contains `{FY}`, and ends with a separator and `{SEQn}`.
 *
 * Pure functions with no runtime dependencies, so the admin preview and the server share them.
 */
export class InvoiceNumberFormatUtil {
  static render(input: IInvoiceNumberRenderInput): string {
    const fy = InvoiceNumberFormatUtil.fyToken(input.invoiceDate, input.fyStartMonth);
    return input.template.replace(RENDER_TOKEN, (_match: string, token: string, digits?: string) => {
      if (digits) {
        return String(input.sequence).padStart(Number(digits), '0');
      }
      if (token === 'PREFIX') {
        return input.prefix;
      }
      if (token === 'FY') {
        return fy;
      }
      return input.typeLetter;
    });
  }

  /** `2627` for FY 2026-27 (any start month but January), `2026` for a calendar year. */
  static fyToken(invoiceDate: string, fyStartMonth: number): string {
    const startMonth = FinancialYearUtil.normaliseStartMonth(fyStartMonth);
    const [yearText, monthText] = invoiceDate.split('-');
    const year = Number(yearText);
    const startYear = Number(monthText) >= startMonth ? year : year - 1;
    if (startMonth === 1) {
      return `${startYear}`;
    }
    return `${String(startYear % 100).padStart(2, '0')}${String((startYear + 1) % 100).padStart(2, '0')}`;
  }

  static typeLetter(invoiceType: BusinessTypeEnum | string, series: InvoiceSeriesEnum | string, isCreditNote = false): InvoiceTypeLetter {
    if (isCreditNote) {
      return InvoiceTypeLetter.CREDIT_NOTE;
    }
    const isExport = series === InvoiceSeriesEnum.EXPORT;
    if (invoiceType === BusinessTypeEnum.PRODUCT) {
      return isExport ? InvoiceTypeLetter.EXPORT_PRODUCT : InvoiceTypeLetter.DOMESTIC_PRODUCT;
    }
    return isExport ? InvoiceTypeLetter.EXPORT_SERVICE : InvoiceTypeLetter.DOMESTIC_SERVICE;
  }

  /** Rule 46(b) check of one issued number. */
  static isRule46Compliant(invoiceNumber: string): boolean {
    return RULE46_INVOICE_NUMBER.test(invoiceNumber);
  }

  /**
   * Errors that stop a prefix + template from being saved (decision 6); empty when valid.
   * With `gstLimit`, the first and the largest number (all 9s) of every type letter must satisfy Rule 46.
   */
  static validate(template: string | null | undefined, prefix: string | null | undefined, options: IInvoiceNumberValidateOptions): string[] {
    const errors: string[] = [];
    const prefixValue = prefix ?? '';
    const templateValue = template ?? '';
    if (!INVOICE_PREFIX_PATTERN.test(prefixValue)) {
      errors.push('Prefix must be 1 to 5 capital letters or digits.');
    }
    if (!templateValue.trim()) {
      errors.push('Number format is required.');
      return errors;
    }
    if (templateValue.length > INVOICE_NUMBER_FORMAT_MAX_LENGTH) {
      errors.push(`Number format must be at most ${INVOICE_NUMBER_FORMAT_MAX_LENGTH} characters.`);
    }

    const seen = new Set<string>();
    let sequenceDigits: number | null = null;
    for (const group of templateValue.match(BRACE_GROUP) ?? []) {
      const name = group.slice(1, -1);
      const seqMatch = SEQ_TOKEN.exec(name);
      const key = seqMatch ? 'SEQ' : name;
      if (!seqMatch && !FIXED_TOKENS.includes(name)) {
        errors.push(`Unknown token ${group}. Use {PREFIX}, {FY}, {TYPE} and {SEQn}.`);
        continue;
      }
      if (seen.has(key)) {
        errors.push(`${seqMatch ? '{SEQn}' : group} may appear only once.`);
        continue;
      }
      seen.add(key);
      if (seqMatch) {
        sequenceDigits = Number(seqMatch[1]);
        if (sequenceDigits < INVOICE_SEQUENCE_MIN_DIGITS || sequenceDigits > INVOICE_SEQUENCE_MAX_DIGITS) {
          errors.push(`{SEQn} must have ${INVOICE_SEQUENCE_MIN_DIGITS} to ${INVOICE_SEQUENCE_MAX_DIGITS} digits.`);
        }
      }
    }
    // {FY}: counters restart every FY and invoice numbers are unique across all years
    for (const required of ['PREFIX', 'FY', 'TYPE', 'SEQ']) {
      if (!seen.has(required)) {
        errors.push(`Number format must contain ${required === 'SEQ' ? '{SEQn}' : `{${required}}`}.`);
      }
    }
    // Prefix first and the counter last, each set off by a separator: numbers of different
    // franchises can't collide, and Table 13 reads the counter from the trailing digits
    if (seen.has('PREFIX') && !/^\{PREFIX\}[\/-]/.test(templateValue)) {
      errors.push('Number format must start with {PREFIX} followed by / or -.');
    }
    if (seen.has('SEQ') && !/[\/-]\{SEQ\d+\}$/.test(templateValue)) {
      errors.push('Number format must end with {SEQn}, after a / or -.');
    }

    const literals = templateValue.replace(BRACE_GROUP, '');
    const badCharacters = Array.from(new Set(literals.replace(/[\/-]/g, '').split(''))).filter((character) => character);
    if (badCharacters.length > 0) {
      const shown = badCharacters.map((character) => (character === ' ' ? 'space' : `"${character}"`)).join(', ');
      errors.push(`Only / and - may separate the tokens (found ${shown}).`);
    }

    if (errors.length > 0 || !options.gstLimit || sequenceDigits === null) {
      return errors;
    }
    // Largest number first, so the length error quotes the all-9s number
    const samples = [10 ** sequenceDigits - 1, 1].flatMap((sequence) =>
      ALL_TYPE_LETTERS.map((typeLetter) =>
        InvoiceNumberFormatUtil.render({
          template: templateValue,
          prefix: prefixValue,
          fyStartMonth: 4,
          invoiceDate: '2026-04-01',
          typeLetter,
          sequence,
        }),
      ),
    );
    const longest = samples.reduce((a, b) => (b.length > a.length ? b : a));
    if (longest.length > 16) {
      errors.push(`The longest number, ${longest}, has ${longest.length} characters; Indian GST invoices allow at most 16 (Rule 46).`);
      return errors;
    }
    const nonCompliant = samples.find((sample) => !RULE46_INVOICE_NUMBER.test(sample));
    if (nonCompliant) {
      errors.push(`${nonCompliant} breaks Rule 46: a number must start with a letter or a digit 1-9.`);
    }
    return errors;
  }
}
