import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpService } from './http.service';
import { ProgramPlan, ProgramPlanService } from './program-plan.service';
import {
  ICheckoutAddressData,
  ICheckoutMemberData,
  ICheckoutMemberResponse,
  IMemberPayment,
  IMemberProduct,
  IPaymentGateway,
  IPublicCheckoutOrderResponse,
  IPublicPlanOrderRequest,
  IPublicPlanTaxCalculationRequest,
  IPublicPlanTaxCalculationResponse,
  IPublicProductOrderRequest,
  IPublicProductTaxCalculationRequest,
  IPublicProductTaxCalculationResponse,
} from '@eatfit247-shared-library';

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
  private readonly platformId = inject(PLATFORM_ID);

  private getCheckoutAuthHeaders(): { [key: string]: string } {
    if (!isPlatformBrowser(this.platformId)) return {};
    const token = sessionStorage.getItem('checkoutToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

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
        addressData,
        { headers: this.getCheckoutAuthHeaders() }
      );
      return res.data || null;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  }

  /**
   * Calculate tax for a plan (promo code applied on the server)
   */
  async calculateTax(
    memberId: number,
    taxData: IPublicPlanTaxCalculationRequest
  ): Promise<IPublicPlanTaxCalculationResponse | null> {
    try {
      const res = await this.httpService.post<IPublicPlanTaxCalculationResponse>(
        `checkout/plan/member/${memberId}/calculate-tax`,
        taxData,
        { headers: this.getCheckoutAuthHeaders() }
      );
      return res.data || null;
    } catch (error) {
      console.error('Error calculating tax:', error);
      throw error;
    }
  }

  /**
   * Calculate tax for product checkout (promo code applied on the server)
   */
  async calculateProductTax(
    memberId: number,
    taxData: IPublicProductTaxCalculationRequest
  ): Promise<IPublicProductTaxCalculationResponse | null> {
    try {
      const res =
        await this.httpService.post<IPublicProductTaxCalculationResponse>(
          `checkout/member/${memberId}/calculate-tax`,
          taxData,
          { headers: this.getCheckoutAuthHeaders() }
        );
      return res.data || null;
    } catch (error) {
      console.error('Error calculating product tax:', error);
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
        `checkout/product/supported-gateways?currency=${currency}`,
        { headers: this.getCheckoutAuthHeaders() }
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
        `checkout/plan/supported-gateways?currency=${currency}`,
        { headers: this.getCheckoutAuthHeaders() }
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
   * Create the PENDING product order and its gateway order (before payment).
   * The server prices it; the response carries the gateway checkout payload.
   * @param recaptchaToken - reCAPTCHA token (passed in headers)
   */
  async createProductOrder(
    memberId: number,
    orderData: IPublicProductOrderRequest,
    recaptchaToken?: string
  ): Promise<IPublicCheckoutOrderResponse | null> {
    try {
      const headers: { [key: string]: string } = { ...this.getCheckoutAuthHeaders() };
      if (recaptchaToken) {
        headers['X-Recaptcha-Token'] = recaptchaToken;
      }
      const res = await this.httpService.post<IPublicCheckoutOrderResponse>(
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
   * Create the PENDING plan payment and its gateway order (before payment).
   * The server prices it; the response carries the gateway checkout payload.
   * @param recaptchaToken - reCAPTCHA token (passed in headers)
   */
  async createPlanOrder(
    memberId: number,
    orderData: IPublicPlanOrderRequest,
    recaptchaToken?: string
  ): Promise<IPublicCheckoutOrderResponse | null> {
    try {
      const headers: { [key: string]: string } = { ...this.getCheckoutAuthHeaders() };
      if (recaptchaToken) {
        headers['X-Recaptcha-Token'] = recaptchaToken;
      }
      const res = await this.httpService.post<IPublicCheckoutOrderResponse>(
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
      }>(`checkout/member/${memberId}/product/${memberProductId}/invoice`, {
        headers: this.getCheckoutAuthHeaders(),
      });
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
      }>(`checkout/plan/member/${memberId}/payment/${paymentId}/invoice`, {
        headers: this.getCheckoutAuthHeaders(),
      });
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
        `checkout/order/${gatewayOrderId}`,
        { headers: this.getCheckoutAuthHeaders() }
      );
      return res.data || null;
    } catch (error) {
      console.error('Error fetching product order details:', error);
      throw error;
    }
  }

  /**
   * Get plan order details by gateway order ID
   * Uses checkout/plan/:gatewayOrderId endpoint
   * @param gatewayOrderId - Gateway order ID
   */
  async getPlanOrderDetails(gatewayOrderId: string): Promise<IMemberPayment | null> {
    try {
      const res = await this.httpService.get<IMemberPayment>(
        `checkout/plan/${gatewayOrderId}`,
        { headers: this.getCheckoutAuthHeaders() }
      );
      return res.data || null;
    } catch (error) {
      console.error('Error fetching plan order details:', error);
      throw error;
    }
  }
}

