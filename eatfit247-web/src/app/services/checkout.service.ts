import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { ProgramPlan, ProgramPlanService } from './program-plan.service';
import {
  ICheckoutAddressData,
  ICheckoutMemberData,
  ICheckoutMemberResponse,
  ICreatePaymentLinkRequest,
  ICreatePlanOrderRequest,
  IManageMemberProduct,
  IMemberPayment,
  IMemberProduct,
  IPaymentGateway,
  IPaymentLinkResponse,
  ITaxCalculationRequest,
  ITaxCalculationResponse
} from 'eatfit247-shared-library';

/**
 * Service to handle checkout operations
 * Manages member creation, address, tax calculation, and payment
 */
@Injectable({
  providedIn: 'root',
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
      return plans.find((p) => p.programPlanId === programPlanId) || null;
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
      const requestBody = recaptchaToken ? { ...memberData, recaptchaToken } : memberData;
      return await this.httpService.post<ICheckoutMemberResponse>(
        'public/member/create',
        requestBody
      );
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  }

  /**
   * Create address for member
   */
  async createAddress(
    memberId: number,
    addressData: ICheckoutAddressData
  ): Promise<{ addressId: number } | null> {
    try {
      return await this.httpService.post<{ addressId: number }>(
        `public/checkout/member/${memberId}/address`,
        addressData
      );
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  }

  /**
   * Calculate tax for payment
   */
  async calculateTax(
    memberId: number,
    taxData: ITaxCalculationRequest
  ): Promise<ITaxCalculationResponse | null> {
    try {
      return await this.httpService.post<ITaxCalculationResponse>(
        `public/checkout/member/${memberId}/calculate-tax`,
        taxData
      );
    } catch (error) {
      console.error('Error calculating tax:', error);
      throw error;
    }
  }

  /**
   * Create payment link
   */
  async createPaymentLink(
    memberId: number,
    paymentData: Omit<ICreatePaymentLinkRequest, 'franchisePaymentGatewayId'> & {
      franchisePaymentGatewayId?: number;
    }
  ): Promise<IPaymentLinkResponse | null> {
    try {
      return await this.httpService.post<IPaymentLinkResponse>(
        `public/checkout/member/${memberId}/payment-link`,
        paymentData
      );
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
      return await this.httpService.get<{
        country: Array<{ id: number; label: string }>;
        state: Array<{ id: number; label: string; parentId: number }>;
        addressType: Array<{ id: number; label: string }>;
      }>('public/address/address-master');
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
      return await this.httpService.get<{
        country: Array<{ id: number; label: string; phoneNumberCode: string | null }>;
        countryCode: Array<{ id: string; label: string }>;
      }>('public/member-payment/master-data');
    } catch (error) {
      console.error('Error fetching checkout master data:', error);
      return null;
    }
  }

  /**
   * Get supported payment gateways for product checkout
   * Reuses Admin-side logic to get gateways for franchise (BusinessTypeEnum.PRODUCT)
   */
  async getSupportedPaymentGateways(currency: string = 'INR'): Promise<IPaymentGateway[]> {
    try {
      const data = await this.httpService.get<IPaymentGateway[]>(
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
  async getSupportedPaymentGatewaysForPlan(currency: string = 'INR'): Promise<IPaymentGateway[]> {
    try {
      const data = await this.httpService.get<IPaymentGateway[]>(
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
  async createProductOrder(memberId: number, orderData: IManageMemberProduct): Promise<any> {
    try {
      return await this.httpService.post(
        `public/checkout/member/${memberId}/product/order`,
        orderData
      );
    } catch (error) {
      console.error('Error creating product order:', error);
      throw error;
    }
  }

  /**
   * Create plan order in txn_member_payments table
   * Uses member-payment.service for plan orders
   */
  async createPlanOrder(memberId: number, orderData: ICreatePlanOrderRequest): Promise<any> {
    try {
      return await this.httpService.post(
        `public/checkout/plan/member/${memberId}/order`,
        orderData
      );
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
  async downloadInvoice(
    memberId: number,
    memberProductId: number
  ): Promise<{
    buffer: string;
    fileName: string;
  } | null> {
    try {
      return await this.httpService.get<{ buffer: string; fileName: string }>(
        `public/checkout/member/${memberId}/product/${memberProductId}/invoice`
      );
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
  async downloadPlanInvoice(
    memberId: number,
    paymentId: number
  ): Promise<{ buffer: string; fileName: string } | null> {
    try {
      return await this.httpService.get<{ buffer: string; fileName: string }>(
        `public/checkout/plan/member/${memberId}/payment/${paymentId}/invoice`
      );
    } catch (error) {
      console.error('Error downloading plan invoice:', error);
      throw error;
    }
  }

  /**
   * Get product order details by gateway order ID
   * Uses public/checkout/order/:gatewayOrderId endpoint
   * @param gatewayOrderId - Gateway order ID
   */
  async getProductOrderDetails(gatewayOrderId: string): Promise<IMemberProduct | null> {
    try {
      return await this.httpService.get(`public/checkout/order/${gatewayOrderId}`);
    } catch (error) {
      console.error('Error fetching product order details:', error);
      throw error;
    }
  }

  /**
   * Get plan order details by gateway order ID
   * Uses public/member-payment/order/plan/:gatewayOrderId endpoint
   * @param gatewayOrderId - Gateway order ID
   */
  async getPlanOrderDetails(gatewayOrderId: string): Promise<IMemberPayment | null> {
    try {
      return await this.httpService.get(`public/checkout/plan/${gatewayOrderId}`);
    } catch (error) {
      console.error('Error fetching plan order details:', error);
      throw error;
    }
  }
}

