import { TaxTypeEnum } from '../../enum';

/** GSTIN: 2-digit State code + PAN (5 letters, 4 digits, 1 letter) + entity number + a letter ('Z' by default) + check character. */
export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][A-Z][0-9A-Z]$/;

/** UAE Tax Registration Number: 15 digits. */
export const TRN_PATTERN = /^[0-9]{15}$/;

const GSTIN_CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** GST State codes a GSTIN can start with: 01–38, 97 (Other Territory) and 99 (Centre Jurisdiction). */
const GST_STATE_CODES = new Set<string>([
  ...Array.from({ length: 38 }, (_unused, index) => String(index + 1).padStart(2, '0')),
  '97',
  '99',
]);

/** A GST State code in the State master's form: `7` for Delhi (`07` in a GSTIN), `27` for Maharashtra. */
export function gstStateCode(value: string | null | undefined): string | null {
  const text = (value ?? '').trim();
  if (!text) {
    return null;
  }
  return /^\d+$/.test(text) ? String(Number(text)) : text.toUpperCase();
}

export interface ITaxRegistrationNumberCheck {
  valid: boolean;
  /** Upper case, without spaces or punctuation */
  normalized: string;
  /** GSTIN: its State code, in the State master's form (`7`, not `07`) */
  stateCode: string | null;
  /** Why it is invalid; null when valid */
  error: string | null;
}

/**
 * Customer and franchise tax numbers (configurable tax treatment, decision 10): a GSTIN by format, State
 * code and mod-36 check character (CGST Rule 10); a UAE TRN as 15 digits. Pure, shared by the admin form
 * and the server.
 */
export class TaxRegistrationNumberUtil {
  /** Upper case, spaces and the punctuation people type (`-`, `.`, `/`) removed. */
  static normalize(value: string | null | undefined): string {
    return (value ?? '').toUpperCase().replace(/[\s\-./]/g, '');
  }

  /** The GSTIN check character for its first 14 characters (GSTN's mod-36 algorithm). */
  static gstinCheckCharacter(first14: string): string {
    let sum = 0;
    for (let index = 0; index < 14; index += 1) {
      const product = GSTIN_CHARACTERS.indexOf(first14[index]) * (index % 2 === 0 ? 1 : 2);
      sum += Math.floor(product / 36) + (product % 36);
    }
    return GSTIN_CHARACTERS[(36 - (sum % 36)) % 36];
  }

  static checkGstin(value: string | null | undefined): ITaxRegistrationNumberCheck {
    const normalized = TaxRegistrationNumberUtil.normalize(value);
    const invalid = (error: string): ITaxRegistrationNumberCheck => ({ valid: false, normalized, stateCode: null, error });
    if (!GSTIN_PATTERN.test(normalized)) {
      return invalid('A GSTIN has 15 characters: State code, PAN, entity number, a letter and a check character.');
    }
    const stateCode = normalized.slice(0, 2);
    if (!GST_STATE_CODES.has(stateCode)) {
      return invalid(`${stateCode} is not a GST State code.`);
    }
    if (TaxRegistrationNumberUtil.gstinCheckCharacter(normalized) !== normalized[14]) {
      return invalid('The GSTIN check character does not match: check the number for a typo.');
    }
    return { valid: true, normalized, stateCode: gstStateCode(stateCode), error: null };
  }

  static checkTrn(value: string | null | undefined): ITaxRegistrationNumberCheck {
    const normalized = TaxRegistrationNumberUtil.normalize(value);
    if (!TRN_PATTERN.test(normalized)) {
      return { valid: false, normalized, stateCode: null, error: 'A UAE TRN has 15 digits.' };
    }
    return { valid: true, normalized, stateCode: null, error: null };
  }

  /** A customer's number for the country of their billing address: a GSTIN in India, a TRN in the UAE. */
  static checkForCountry(countryCode: string | null | undefined, value: string | null | undefined): ITaxRegistrationNumberCheck {
    const country = (countryCode ?? '').trim().toUpperCase();
    if (country === 'IN') {
      return TaxRegistrationNumberUtil.checkGstin(value);
    }
    if (country === 'AE') {
      return TaxRegistrationNumberUtil.checkTrn(value);
    }
    return {
      valid: false,
      normalized: TaxRegistrationNumberUtil.normalize(value),
      stateCode: null,
      error: 'Customer tax numbers are accepted for India (GSTIN) and the UAE (TRN) only.',
    };
  }

  /** The label printed next to a registration number. */
  static label(taxSystem: TaxTypeEnum | string, countryCode: string | null | undefined): string {
    if (taxSystem === TaxTypeEnum.GST) {
      return 'GSTIN';
    }
    if (taxSystem === TaxTypeEnum.VAT) {
      return (countryCode ?? '').trim().toUpperCase() === 'AE' ? 'TRN' : 'VAT No.';
    }
    return 'Tax No.';
  }
}

/** A country as the dial-code helper needs it (`mst_countries`). */
export interface IDialCodeCountry {
  countryCode: string;
  country?: string | null;
  /** e.g. `+971`, `+1`, `+1-684` */
  phoneNumberCode?: string | null;
}

/**
 * Member dial codes are stored as `+971`, `971`, `00971` or a country name (`India`), and sometimes run into
 * the number (`+9715`). Maps one to the ISO countries using it (`+1` → CA and US); an exact code first, else
 * the longest code the digits start with. Empty when it can't be read (evidence: NOT_AVAILABLE, decision 9).
 */
export class DialCodeUtil {
  static digits(value: string | null | undefined): string {
    return (value ?? '').replace(/\D/g, '').replace(/^00/, '');
  }

  static countryCodes(value: string | null | undefined, countries: IDialCodeCountry[]): string[] {
    const text = (value ?? '').trim();
    if (!text) {
      return [];
    }
    if (/[A-Za-z]/.test(text) && !/\d/.test(text)) {
      const name = text.toLowerCase();
      const byName = countries.filter(
        (c) => (c.country ?? '').trim().toLowerCase() === name || (text.length === 2 && c.countryCode.trim().toUpperCase() === text.toUpperCase()),
      );
      return DialCodeUtil.unique(byName.map((c) => c.countryCode));
    }
    const digits = DialCodeUtil.digits(text);
    if (!digits) {
      return [];
    }
    const byCode = (prefix: string): string[] =>
      DialCodeUtil.unique(countries.filter((c) => DialCodeUtil.digits(c.phoneNumberCode) === prefix).map((c) => c.countryCode));
    const exact = byCode(digits);
    if (exact.length > 0) {
      return exact;
    }
    // Dial codes have at most 4 digits (`+1-684`)
    for (let length = Math.min(digits.length - 1, 4); length >= 1; length -= 1) {
      const prefixed = byCode(digits.slice(0, length));
      if (prefixed.length > 0) {
        return prefixed;
      }
    }
    return [];
  }

  private static unique(codes: string[]): string[] {
    return Array.from(new Set(codes.map((code) => code.trim().toUpperCase()).filter((code) => code))).sort();
  }
}
