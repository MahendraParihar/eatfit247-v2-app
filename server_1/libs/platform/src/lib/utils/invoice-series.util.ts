import { IMemberAddress, InvoiceSeriesEnum } from '@eatfit247-shared-lib';

export const INDIA_COUNTRY_CODE = 'IN';

export interface IInvoiceSeriesInput {
  /** Country of the issuing franchise (from its address) */
  franchiseCountryCode: string | null;
  /** Billing country from the record's stored address snapshot; null when it can't be resolved */
  billingCountryCode: string | null;
  /** Tax charged on the record (order total for products) */
  taxAmount: number | string | null;
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
   * Invoice series (roadmap 4.7 decision 1, the same rule as migration 138):
   * EXPORT when the franchise is Indian, the billing country is known and not India,
   * and no tax was charged. Otherwise DOMESTIC.
   *
   * Roadmap 4.6 replaces this body with the stored tax mode (EXPORT_OF_SERVICE / EXPORT_OF_GOODS).
   */
  public static resolve(input: IInvoiceSeriesInput): InvoiceSeriesEnum {
    const franchiseCountry = InvoiceSeriesUtil.normalize(input.franchiseCountryCode);
    const billingCountry = InvoiceSeriesUtil.normalize(input.billingCountryCode);
    const noTax = Number(input.taxAmount || 0) === 0;
    if (franchiseCountry === INDIA_COUNTRY_CODE && billingCountry && billingCountry !== INDIA_COUNTRY_CODE && noTax) {
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
