import { BadRequestException } from '@nestjs/common';
import { EXPORT_TAX_MODES, IMemberAddress, InvoiceSeriesEnum, TaxMode } from '@eatfit247-shared-lib';

export const INDIA_COUNTRY_CODE = 'IN';

export interface IInvoiceSeriesInput {
  /** Country of the issuing franchise (from its address) */
  franchiseCountryCode: string | null;
  /** Billing country from the record's stored address snapshot; null when it can't be resolved */
  billingCountryCode: string | null;
  /** Tax charged on the record (order total for products) */
  taxAmount: number | string | null;
  /** Stored tax mode(s): the payment's, or every line's for a product order */
  taxModes?: Array<TaxMode | string | null | undefined>;
}

/** The parts of a stored address snapshot that identify the billing country. */
export interface ISnapshotCountry {
  countryCode: string | null;
  countryId: number | null;
  country: string | null;
}

interface IAddressSnapshotLike {
  address?: IMemberAddress | null;
  billingAddress?: IMemberAddress | null;
}

export class InvoiceSeriesUtil {
  /**
   * Invoice series of an Indian franchise's invoice (roadmap 4.6, replacing 4.7's interim rule):
   *   - EXPORT when the stored tax mode is an export mode (EXPORT_OF_SERVICE / EXPORT_OF_GOODS),
   *     whether 0% under LUT or IGST-paid. A product order must have every line in an export mode;
   *     mixed lines are a bug and are refused.
   *   - For records priced before 4.6 (stored NO_TAX): the 4.7 / migration 138 rule, i.e. EXPORT when
   *     the billing country is known and not India and no tax was charged.
   *   - Otherwise DOMESTIC (incl. a foreign client paying INR over Indian rails, taxed as IGST).
   * Non-Indian franchises always use DOMESTIC.
   */
  public static resolve(input: IInvoiceSeriesInput): InvoiceSeriesEnum {
    const franchiseCountry = InvoiceSeriesUtil.normalize(input.franchiseCountryCode);
    if (franchiseCountry !== INDIA_COUNTRY_CODE) {
      return InvoiceSeriesEnum.DOMESTIC;
    }
    const modes = (input.taxModes || []).filter((mode): mode is string => !!mode);
    const exportModes = modes.filter((mode) => EXPORT_TAX_MODES.includes(mode as TaxMode));
    if (exportModes.length > 0) {
      if (exportModes.length !== modes.length) {
        throw new BadRequestException('The order lines disagree on export vs domestic tax; fix the order before invoicing.');
      }
      return InvoiceSeriesEnum.EXPORT;
    }
    const legacyNoTax = modes.length === 0 || modes.every((mode) => mode === TaxMode.NO_TAX);
    const billingCountry = InvoiceSeriesUtil.normalize(input.billingCountryCode);
    const noTax = Number(input.taxAmount || 0) === 0;
    if (legacyNoTax && billingCountry && billingCountry !== INDIA_COUNTRY_CODE && noTax) {
      return InvoiceSeriesEnum.EXPORT;
    }
    return InvoiceSeriesEnum.DOMESTIC;
  }

  /** Billing address of the snapshot, else the address (decision 13). */
  public static snapshotCountry(snapshot: IAddressSnapshotLike | null | undefined): ISnapshotCountry {
    const address = snapshot?.billingAddress || snapshot?.address || null;
    return {
      countryCode: InvoiceSeriesUtil.normalize(address?.countryCode),
      countryId: address?.countryId ? Number(address.countryId) : null,
      country: address?.country?.trim() || null,
    };
  }

  /** Country codes come from CHAR columns, so trim padding and compare upper-case. */
  public static normalize(code: string | null | undefined): string | null {
    const value = (code || '').trim().toUpperCase();
    return value || null;
  }
}
