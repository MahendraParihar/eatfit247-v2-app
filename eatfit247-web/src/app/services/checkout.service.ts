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

export interface PaymentGateway {
  franchisePaymentGatewayId: number;
  gatewayCode: string;
  gatewayName: string;
  providerCountryCode: string;
  currencyCode: string;
  isPrimary: boolean;
  supportsDomestic: boolean;
  supportsInternational: boolean;
}

export interface CreateProductOrderRequest {
  paymentModeId?: number | null;
  billingAddressId?: number | null;
  addressId?: number | null;
  transactionId?: string;
  paymentDate: string; // ISO date string
  paymentStatusId: number;
  taxPercentage: number;
  currencyCode: string;
  promoCode?: string;
  gstNumber?: string;
  paymentSource: string; // PaymentSourceEnum
  orderAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentLink?: string;
  gatewayProvider?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paymentGatewayResponse?: Record<string, any>;
  recaptchaToken?: string; // reCAPTCHA v3 token (required by backend)
  orderItems: Array<{
    productId: number;
    productVariantId: number;
    quantity: number;
    unit: string;
    price: number;
    currency: string;
  }>;
}

export interface CreatePlanOrderRequest {
  paymentModeId?: number | null;
  billingAddressId?: number | null;
  addressId?: number | null;
  transactionId?: string;
  paymentDate: string; // ISO date string
  paymentStatusId: number;
  programId: number;
  programPlanId: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  isTaxApplicable: boolean;
  taxPercentage: number;
  currencyCode: string;
  promoCode?: string;
  gstNumber?: string;
  paymentSource: string; // PaymentSourceEnum
  orderAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentLink?: string;
  gatewayProvider?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paymentGatewayResponse?: Record<string, any>;
  recaptchaToken?: string; // reCAPTCHA v3 token (required by backend)
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

  /**
   * Get supported payment gateways for product checkout
   * Reuses Admin-side logic to get gateways for franchise (BusinessTypeEnum.PRODUCT)
   */
  async getSupportedPaymentGateways(currency: string = 'INR'): Promise<PaymentGateway[]> {
    try {
      const data = await this.httpService.get<PaymentGateway[]>(
        `public/checkout/product/supported-gateways?currency=${currency}`
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching supported payment gateways:', error);
      return [];
    }
  }

  /**
   * Get supported payment gateways for plan checkout
   * Uses franchise SERVICE type (BusinessTypeEnum.SERVICE)
   */
  async getSupportedPaymentGatewaysForPlan(currency: string = 'INR'): Promise<PaymentGateway[]> {
    try {
      const data = await this.httpService.get<PaymentGateway[]>(
        `public/checkout/plan/supported-gateways?currency=${currency}`
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching supported payment gateways for plan:', error);
      return [];
    }
  }

  /**
   * Create product order in txn_member_products table
   * Follows the same pattern as Admin-side Member Product order creation
   */
  async createProductOrder(
    memberId: number,
    orderData: CreateProductOrderRequest
  ): Promise<any> {
    try {
      const data = await this.httpService.post(
        `public/checkout/member/${memberId}/product/order`,
        orderData
      );
      return data;
    } catch (error) {
      console.error('Error creating product order:', error);
      throw error;
    }
  }

  /**
   * Create plan order in txn_member_payments table
   * Uses member-payment.service for plan orders
   */
  async createPlanOrder(
    memberId: number,
    orderData: CreatePlanOrderRequest
  ): Promise<any> {
    try {
      const data = await this.httpService.post(
        `public/checkout/plan/member/${memberId}/order`,
        orderData
      );
      return data;
    } catch (error) {
      console.error('Error creating plan order:', error);
      throw error;
    }
  }

  /**
   * Download invoice for product order
   * @param memberId - Member ID
   * @param memberProductId - Member Product ID (order ID)
   */
  async downloadInvoice(memberId: number, memberProductId: number): Promise<{ buffer: string; fileName: string } | null> {
    try {
      const data = await this.httpService.get<{ buffer: string; fileName: string }>(
        `public/checkout/member/${memberId}/product/${memberProductId}/invoice`
      );
      return data;
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  }

  /**
   * Download invoice for plan order
   * @param memberId - Member ID
   * @param paymentId - Member Payment ID (order ID)
   */
  async downloadPlanInvoice(memberId: number, paymentId: number): Promise<{ buffer: string; fileName: string } | null> {
    try {
      const data = await this.httpService.get<{ buffer: string; fileName: string }>(
        `public/checkout/plan/member/${memberId}/payment/${paymentId}/invoice`
      );
      return data;
    } catch (error) {
      console.error('Error downloading plan invoice:', error);
      throw error;
    }
  }
}

