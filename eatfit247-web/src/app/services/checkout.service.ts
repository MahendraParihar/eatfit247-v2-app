import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { ProgramPlanService, ProgramPlan } from './program-plan.service';
import { ICheckoutMemberData, ICheckoutMemberResponse } from 'eatfit247-shared-library';

export interface CheckoutAddressData {
  postalAddress: string;
  cityVillage?: string;
  stateId: number;
  countryId: number;
  pinCode?: string;
  addressName?: string;
}

export interface TaxCalculationRequest {
  orderAmount: number;
  discountAmount: number;
  isTaxApplicable: boolean;
  isPlanFeesIncludedTax: boolean;
  currencyCode: string;
  billingAddressId?: number;
  addressId?: number;
}

export interface TaxCalculationResponse {
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  taxObj: Record<string, { amount: number; taxPercentage: number }>;
  taxType?: string;
  taxMode?: string;
  invoiceNote?: string;
}

export interface PaymentLinkRequest {
  amount: number;
  currency: string;
  description?: string;
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
}

export interface PaymentLinkResponse {
  short_url: string;
  id: string;
  gatewayCode: string;
}

/**
 * Service to handle checkout operations
 * Manages member creation, address, tax calculation, and payment
 */
@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private readonly httpService = inject(HttpService);
  private readonly programPlanService = inject(ProgramPlanService);

  /**
   * Get program plan details by ID
   */
  async getProgramPlan(programPlanId: number): Promise<ProgramPlan | null> {
    try {
      const plans = await this.programPlanService.getAllProgramPlans();
      return plans.find(p => p.programPlanId === programPlanId) || null;
    } catch (error) {
      console.error('Error fetching program plan:', error);
      return null;
    }
  }

  /**
   * Create member (public endpoint)
   * Uses PublicMemberController at /api/v2/public/member/create
   * @param memberData - Member data to create
   * @param recaptchaToken - reCAPTCHA v3 token (required by backend)
   */
  async createMember(
    memberData: ICheckoutMemberData,
    recaptchaToken?: string
  ): Promise<ICheckoutMemberResponse | null> {
    try {
      // Include reCAPTCHA token in request body if provided
      const requestBody = recaptchaToken
        ? { ...memberData, recaptchaToken }
        : memberData;

      const data = await this.httpService.post<ICheckoutMemberResponse>(
        'public/member/create',
        requestBody
      );
      return data;
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  }

  /**
   * Create address for member
   */
  async createAddress(memberId: number, addressData: CheckoutAddressData): Promise<{ addressId: number } | null> {
    try {
      // TODO: Update endpoint when public API is available
      const data = await this.httpService.post<{ addressId: number }>(
        `public/checkout/member/${memberId}/address`,
        addressData
      );
      return data;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  }

  /**
   * Calculate tax for payment
   */
  async calculateTax(memberId: number, taxData: TaxCalculationRequest): Promise<TaxCalculationResponse | null> {
    try {
      const data = await this.httpService.post<TaxCalculationResponse>(
        `public/checkout/member/${memberId}/calculate-tax`,
        taxData
      );
      return data;
    } catch (error) {
      console.error('Error calculating tax:', error);
      throw error;
    }
  }

  /**
   * Create payment link
   */
  async createPaymentLink(memberId: number, paymentData: PaymentLinkRequest): Promise<PaymentLinkResponse | null> {
    try {
      const data = await this.httpService.post<PaymentLinkResponse>(
        `public/checkout/member/${memberId}/payment-link`,
        paymentData
      );
      return data;
    } catch (error) {
      console.error('Error creating payment link:', error);
      throw error;
    }
  }

  /**
   * Get address master data (countries, states, address types)
   */
  async getAddressMasterData(): Promise<{
    country: Array<{ id: number; label: string }>;
    state: Array<{ id: number; label: string; parentId: number }>;
    addressType: Array<{ id: number; label: string }>;
  } | null> {
    try {
      const data = await this.httpService.get<{
        country: Array<{ id: number; label: string }>;
        state: Array<{ id: number; label: string; parentId: number }>;
        addressType: Array<{ id: number; label: string }>;
      }>('public/address/address-master');
      return data;
    } catch (error) {
      console.error('Error fetching address master data:', error);
      return null;
    }
  }

  /**
   * Get country dropdowns with phone codes
   */
  async getCheckoutMasterData(): Promise<{
    country: Array<{ id: number; label: string; phoneNumberCode: string | null }>;
    countryCode: Array<{ id: string; label: string }>;
  } | null> {
    try {
      const data = await this.httpService.get<{
        country: Array<{ id: number; label: string; phoneNumberCode: string | null }>;
        countryCode: Array<{ id: string; label: string }>;
      }>('public/member-payment/master-data');
      return data;
    } catch (error) {
      console.error('Error fetching checkout master data:', error);
      return null;
    }
  }
}

