/** An issued number split into its series and its counter. */
export interface IDocumentSeriesParts {
  /** The number without its trailing digit run, e.g. `EFM/2627/S/` */
  seriesKey: string;
  /** The trailing digit run as a number; null when the number does not end in digits */
  sequence: number | null;
  /** Digits in the trailing run (the zero padding) */
  width: number;
  /**
   * The counter is set off by `/` or `-` and is a safe integer: true for every templated number
   * (decision 3) and the 4.7 long format; false for older formats such as `EF24B7…`
   */
  separated: boolean;
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
      return { seriesKey: value, sequence: null, width: 0, separated: false };
    }
    const sequence = Number(match[2]);
    return {
      seriesKey: match[1],
      sequence,
      width: match[2].length,
      separated: /[\/-]$/.test(match[1]) && Number.isSafeInteger(sequence),
    };
  }

  static join(seriesKey: string, sequence: number, width: number): string {
    return `${seriesKey}${String(sequence).padStart(width, '0')}`;
  }
}
