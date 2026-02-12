import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { ProgramPlan, ProgramPlanService } from './program-plan.service';
import {
  ICalculateProductVariantTaxRequest,
  ICalculateProductVariantTaxResponse,
  ICheckoutAddressData,
  ICheckoutMemberData,
  ICheckoutMemberResponse,
  ICreatePaymentLinkRequest,
  IManageMemberPayment,
  IManageMemberProduct,
  IMemberProduct,
  IPaymentGateway,
  IPaymentLinkResponse,
  ITaxCalculationRequest
} from '@eatfit247-shared-library';

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
   * Uses PublicMemberController at /api/v2/member/create
   * @param memberData - Member data to create
   * @param recaptchaToken - reCAPTCHA v3 token (required by backend, passed in headers)
   */
  async createMember(
    memberData: ICheckoutMemberData,
    recaptchaToken?: string
  ): Promise<ICheckoutMemberResponse | null> {
    try {
      // Include reCAPTCHA token in request headers if provided
      const headers: { [key: string]: string } = {};
      if (recaptchaToken) {
        headers['X-Recaptcha-Token'] = recaptchaToken;
      }
      const res = await this.httpService.post<ICheckoutMemberResponse>(
        'member/create',
        memberData,
        { headers }
      );
      return res.data || null;
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
      const res = await this.httpService.post<{ addressId: number }>(
        `checkout/member/${memberId}/address`,
        addressData
      );
      return res.data || null;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  }

  /**
   * Calculate tax for payment (for plans)
   */
  async calculateTax(
    memberId: number,
    taxData: ITaxCalculationRequest
  ): Promise<ICalculateProductVariantTaxResponse | null> {
    try {
      const res =
        await this.httpService.post<ICalculateProductVariantTaxResponse>(
          `checkout/member/${memberId}/calculate-tax`,
          taxData
        );
      return res.data || null;
    } catch (error) {
      console.error('Error calculating tax:', error);
      throw error;
    }
  }

  /**
   * Calculate tax for product checkout
   * Uses ICalculateProductVariantTaxRequest payload
   */
  async calculateProductTax(
    memberId: number,
    taxData: ICalculateProductVariantTaxRequest
  ): Promise<ICalculateProductVariantTaxResponse | null> {
    try {
      const res =
        await this.httpService.post<ICalculateProductVariantTaxResponse>(
          `checkout/member/${memberId}/calculate-tax`,
          taxData
        );
      return res.data || null;
    } catch (error) {
      console.error('Error calculating product tax:', error);
      throw error;
    }
  }

  /**
   * Create payment link
   */
  async createPaymentLink(
    memberId: number,
    paymentData: Omit<
      ICreatePaymentLinkRequest,
      'franchisePaymentGatewayId'
    > & {
      franchisePaymentGatewayId?: number;
    }
  ): Promise<IPaymentLinkResponse | null> {
    try {
      const res = await this.httpService.post<IPaymentLinkResponse>(
        `checkout/member/${memberId}/payment-link`,
        paymentData
      );
      return res.data || null;
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
      const res = await this.httpService.get<{
        country: Array<{ id: number; label: string }>;
        state: Array<{ id: number; label: string; parentId: number }>;
        addressType: Array<{ id: number; label: string }>;
      }>('address/address-master');
      return res.data || null;
    } catch (error) {
      console.error('Error fetching address master data:', error);
      return null;
    }
  }

  /**
   * Get country dropdowns with phone codes
   */
  async getCheckoutMasterData(): Promise<{
    country: Array<{
      id: number;
      label: string;
      phoneNumberCode: string | null;
    }>;
    countryCode: Array<{ id: string; label: string }>;
  } | null> {
    try {
      const res = await this.httpService.get<{
        country: Array<{
          id: number;
          label: string;
          phoneNumberCode: string | null;
        }>;
        countryCode: Array<{ id: string; label: string }>;
      }>('member-payment/master-data');
      return res.data || null;
    } catch (error) {
      console.error('Error fetching checkout master data:', error);
      return null;
    }
  }

  /**
   * Get supported payment gateways for product checkout
   * Reuses Admin-side logic to get gateways for franchise (BusinessTypeEnum.PRODUCT)
   */
  async getSupportedPaymentGateways(
    currency: string = 'INR'
  ): Promise<IPaymentGateway[]> {
    try {
      const data = await this.httpService.get<IPaymentGateway[]>(
        `checkout/product/supported-gateways?currency=${currency}`
      );
      return data.data || [];
    } catch (error) {
      console.error('Error fetching supported payment gateways:', error);
      return [];
    }
  }

  /**
   * Get supported payment gateways for plan checkout
   * Uses franchise SERVICE type (BusinessTypeEnum.SERVICE)
   */
  async getSupportedPaymentGatewaysForPlan(
    currency: string = 'INR'
  ): Promise<IPaymentGateway[]> {
    try {
      const data = await this.httpService.get<IPaymentGateway[]>(
        `checkout/plan/supported-gateways?currency=${currency}`
      );
      return data.data || [];
    } catch (error) {
      console.error(
        'Error fetching supported payment gateways for plan:',
        error
      );
      return [];
    }
  }

  /**
   * Create product order in txn_member_products table
   * Follows the same pattern as Admin-side Member Product order creation
   * @param memberId - Member ID
   * @param orderData - Order data
   * @param recaptchaToken - Optional reCAPTCHA token (passed in headers)
   */
  async createProductOrder(
    memberId: number,
    orderData: IManageMemberProduct,
    recaptchaToken?: string
  ): Promise<any> {
    try {
      const headers: { [key: string]: string } = {};
      if (recaptchaToken) {
        headers['X-Recaptcha-Token'] = recaptchaToken;
      }
      const res = await this.httpService.post(
        `checkout/member/${memberId}/product/order`,
        orderData,
        { headers }
      );
      return res.data || null;
    } catch (error) {
      console.error('Error creating product order:', error);
      throw error;
    }
  }

  /**
   * Create plan order in txn_member_payments table
   * Uses member-payment.service for plan orders
   * @param memberId - Member ID
   * @param orderData - Order data
   * @param recaptchaToken - Optional reCAPTCHA token (passed in headers)
   */
  async createPlanOrder(
    memberId: number,
    orderData: IManageMemberPayment,
    recaptchaToken?: string
  ): Promise<any> {
    try {
      const headers: { [key: string]: string } = {};
      if (recaptchaToken) {
        headers['X-Recaptcha-Token'] = recaptchaToken;
      }
      const res = await this.httpService.post(
        `checkout/plan/member/${memberId}/order`,
        orderData,
        { headers }
      );
      return res.data || null;
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
      const res = await this.httpService.get<{
        buffer: string;
        fileName: string;
      }>(`checkout/member/${memberId}/product/${memberProductId}/invoice`);
      return res.data || null;
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
      const res = await this.httpService.get<{
        buffer: string;
        fileName: string;
      }>(`checkout/plan/member/${memberId}/payment/${paymentId}/invoice`);
      return res.data || null;
    } catch (error) {
      console.error('Error downloading plan invoice:', error);
      throw error;
    }
  }

  /**
   * Get product order details by gateway order ID
   * Uses checkout/order/:gatewayOrderId endpoint
   * @param gatewayOrderId - Gateway order ID
   */
  async getProductOrderDetails(
    gatewayOrderId: string
  ): Promise<IMemberProduct | null> {
    try {
      const res = await this.httpService.get<IMemberProduct>(
        `checkout/order/${gatewayOrderId}`
      );
      return res.data || null;
    } catch (error) {
      console.error('Error fetching product order details:', error);
      throw error;
    }
  }

  /**
   * Get plan order details by gateway order ID
   * Uses member-payment/order/plan/:gatewayOrderId endpoint
   * @param gatewayOrderId - Gateway order ID
   */
  async getPlanOrderDetails(gatewayOrderId: string): Promise<IMemberProduct> {
    try {
      const res = await this.httpService.get<IMemberProduct>(
        `checkout/plan/${gatewayOrderId}`
      );
      return res.data || null;
    } catch (error) {
      console.error('Error fetching plan order details:', error);
      throw error;
    }
  }
}

