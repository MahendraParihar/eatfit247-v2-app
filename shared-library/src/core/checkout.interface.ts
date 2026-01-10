/**
 * Checkout-related interfaces for public member creation
 */

export interface ICheckoutMemberData {
  firstName: string;
  lastName: string;
  emailId: string;
  countryCode: string;
  contactNumber: string;
  countryId: number;
  referrerId?: number;
  nutritionistId?: number;
}

export interface ICheckoutMemberResponse {
  memberId: number;
  isNew: boolean;
}

