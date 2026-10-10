/**
 * ISO-4217 minor-unit exponents for currencies that differ from the default of 2.
 * Payment gateways take and return amounts in minor units, so every gateway amount
 * conversion must go through {@link CurrencyUtil} instead of a hardcoded `/ 100`.
 */
const NON_DEFAULT_EXPONENTS: Readonly<Record<string, number>> = {
  // Zero-decimal currencies
  BIF: 0,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  ISK: 0,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  PYG: 0,
  RWF: 0,
  UGX: 0,
  UYI: 0,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,
  // Three-decimal currencies
  BHD: 3,
  IQD: 3,
  JOD: 3,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  TND: 3,
};

const DEFAULT_EXPONENT = 2;

/**
 * Major ↔ minor unit conversion for gateway amounts.
 *
 * Pure arithmetic with no runtime dependencies, so both the NestJS backend
 * and the Angular apps can share it.
 */
export class CurrencyUtil {
  /** Number of decimal places for the currency (ISO-4217); unknown codes use 2. */
  static exponent(currency: string): number {
    const code = CurrencyUtil.normaliseCode(currency);
    return NON_DEFAULT_EXPONENTS[code] ?? DEFAULT_EXPONENT;
  }

  /** Major units (e.g. 1499.50 INR) → integer minor units (149950). */
  static toMinor(amount: number, currency: string): number {
    if (!Number.isFinite(amount)) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    const exponent = CurrencyUtil.exponent(currency);
    const scaled = amount * 10 ** exponent;
    // toFixed(2) absorbs binary float noise (e.g. 19.99 * 100 = 1998.9999999999998)
    // before rounding to the nearest whole minor unit.
    return Math.round(Number(scaled.toFixed(2)));
  }

  /** Integer minor units (e.g. 149950) → major units (1499.5) for the currency. */
  static fromMinor(amountMinor: number, currency: string): number {
    if (!Number.isFinite(amountMinor)) {
      throw new Error(`Invalid minor amount: ${amountMinor}`);
    }
    const exponent = CurrencyUtil.exponent(currency);
    return Number((Math.round(amountMinor) / 10 ** exponent).toFixed(exponent));
  }

  private static normaliseCode(currency: string): string {
    const code = (currency ?? '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) {
      throw new Error(`Invalid ISO-4217 currency code: ${currency}`);
    }
    return code;
  }
}
