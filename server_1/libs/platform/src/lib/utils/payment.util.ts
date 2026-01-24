import { IAddress } from '@eatfit247-shared-lib';

/**
 * Interface for address codes extracted from franchise and billing addresses
 */
export interface IAddressCodes {
  supplierCountryCode: string | null;
  supplierStateCode: string | null;
  customerCountryCode: string | null;
  customerStateCode: string | null;
}

/**
 * Minimal interface for country service methods used by PaymentUtil
 */
export interface ICountryService {
  fetchById(id: number): Promise<{ countryCode: string }>;
}

/**
 * Minimal interface for state service methods used by PaymentUtil
 */
export interface IStateService {
  fetchById(id: number): Promise<{ code: string | null }>;
}

/**
 * Utility class for payment-related operations
 */
export class PaymentUtil {
  /**
   * Extracts country and state codes from franchise and billing addresses
   * @param franchiseAddress - Franchise address (supplier address)
   * @param billingAddress - Billing address (customer address)
   * @param countryService - Country service instance
   * @param stateService - State service instance
   * @returns Object containing extracted country and state codes
   */
  public static async extractAddressCodes(
    franchiseAddress: IAddress | null,
    billingAddress: IAddress | null,
    countryService: ICountryService,
    stateService: IStateService,
  ): Promise<IAddressCodes> {
    let supplierCountryCode: string | null = null;
    let supplierStateCode: string | null = null;
    let customerCountryCode: string | null = null;
    let customerStateCode: string | null = null;

    if (franchiseAddress) {
      if (franchiseAddress.countryId) {
        const franchiseCountry = await countryService.fetchById(franchiseAddress.countryId);
        supplierCountryCode = franchiseCountry.countryCode;
      }
      if (franchiseAddress.stateId) {
        const franchiseState = await stateService.fetchById(franchiseAddress.stateId);
        supplierStateCode = franchiseState.code || null;
      }
    }

    if (billingAddress) {
      if (billingAddress.countryId) {
        const customerCountry = await countryService.fetchById(billingAddress.countryId);
        customerCountryCode = customerCountry.countryCode;
      }
      if (billingAddress.stateId) {
        const customerState = await stateService.fetchById(billingAddress.stateId);
        customerStateCode = customerState.code || null;
      }
    }

    return {
      supplierCountryCode,
      supplierStateCode,
      customerCountryCode,
      customerStateCode,
    };
  }
}


