/** An issued number split into its series and its counter. */
export interface IDocumentSeriesParts {
  /** The number without its trailing digit run, e.g. `EFM/2627/S/` */
  seriesKey: string;
  /** The trailing digit run as a number; null when the number does not end in digits */
  sequence: number | null;
  /** Digits in the trailing run (the zero padding) */
  width: number;
}

const TRAILING_DIGITS = /^(.*?)(\d+)$/;

/**
 * GSTR-1 Table 13 series (compliant invoice numbering, decision 13). Every number is built from a
 * known template ending in its counter, so removing the trailing digit run gives the series
 * exactly: `EFMUM/2026-27/S/000491` → `EFMUM/2026-27/S/` + 491, `EFM/2627/S/00492` → `EFM/2627/S/` + 492.
 */
export class DocumentSeriesUtil {
  static split(invoiceId: string): IDocumentSeriesParts {
    const value = (invoiceId || '').trim();
    const match = TRAILING_DIGITS.exec(value);
    if (!match) {
      return { seriesKey: value, sequence: null, width: 0 };
    }
    return { seriesKey: match[1], sequence: Number(match[2]), width: match[2].length };
  }

  static join(seriesKey: string, sequence: number, width: number): string {
    return `${seriesKey}${String(sequence).padStart(width, '0')}`;
  }
}
