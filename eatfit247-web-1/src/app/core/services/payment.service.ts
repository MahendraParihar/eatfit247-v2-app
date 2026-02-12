import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpService } from './http.service';

export interface PaymentOrderRequest {
  amount: number;
  currency: string;
  description?: string;
  franchisePaymentGatewayId?: number;
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
}

export interface PaymentOrderResponse {
  orderId: string;
  gatewayCode: string;
  keyId: string;
  amount: number;
  currency: string;
  customer: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes: Record<string, any>;
}

export interface VerifyPaymentRequest {
  gatewayCode: string;
  paymentId: string;
  orderId?: string;
  signature?: string;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  paymentDetails?: any;
}

export interface PaymentSuccessCallback {
  (paymentId: string, orderId: string, signature?: string): void;
}

export interface PaymentErrorCallback {
  (error: any): void;
}

/**
 * Service to handle embedded payment gateway integration
 * Supports Razorpay, Stripe, and Telr
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly httpService = inject(HttpService);
  private readonly platformId = inject(PLATFORM_ID);
  private razorpayInstance: any = null;

  /**
   * Load Razorpay script dynamically
   */
  private loadRazorpayScript(): Promise<void> {
    // Only load script in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(new Error('Razorpay is only available in browser environment'));
    }

    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
      document.body.appendChild(script);
    });
  }

  /**
   * Create payment order for embedded checkout (products)
   */
  async createPaymentOrder(
    memberId: number,
    paymentData: PaymentOrderRequest
  ): Promise<PaymentOrderResponse> {
    try {
      const data = await this.httpService.post<PaymentOrderResponse>(
        `checkout/member/${memberId}/product/payment-order`,
        paymentData
      );
      if (!data) {
        throw new Error('Failed to create payment order: No data returned');
      }
      return data.data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }

  /**
   * Create payment order for embedded checkout (plans)
   */
  async createPlanPaymentOrder(
    memberId: number,
    paymentData: PaymentOrderRequest
  ): Promise<PaymentOrderResponse> {
    try {
      const data = await this.httpService.post<PaymentOrderResponse>(
        `checkout/plan/member/${memberId}/payment-order`,
        paymentData
      );
      if (!data) {
        throw new Error('Failed to create payment order: No data returned');
      }
      return data.data;
    } catch (error) {
      console.error('Error creating plan payment order:', error);
      throw error;
    }
  }

  /**
   * Verify payment after completion (products)
   */
  async verifyPayment(
    memberId: number,
    verifyData: VerifyPaymentRequest
  ): Promise<VerifyPaymentResponse> {
    try {
      const data = await this.httpService.post<VerifyPaymentResponse>(
        `checkout/member/${memberId}/product/verify-payment`,
        verifyData
      );
      if (!data) {
        throw new Error('Failed to verify payment: No data returned');
      }
      return data.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Verify payment after completion (plans)
   */
  async verifyPlanPayment(
    memberId: number,
    verifyData: VerifyPaymentRequest
  ): Promise<VerifyPaymentResponse> {
    try {
      const data = await this.httpService.post<VerifyPaymentResponse>(
        `checkout/plan/member/${memberId}/verify-payment`,
        verifyData
      );
      if (!data) {
        throw new Error('Failed to verify payment: No data returned');
      }
      return data.data;
    } catch (error) {
      console.error('Error verifying plan payment:', error);
      throw error;
    }
  }

  /**
   * Initialize Razorpay payment
   */
  async initializeRazorpayPayment(
    orderResponse: PaymentOrderResponse,
    onSuccess: PaymentSuccessCallback,
    onError: PaymentErrorCallback
  ): Promise<void> {
    // Only execute in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      onError(new Error('Razorpay payment is only available in browser environment'));
      return;
    }

    try {
      await this.loadRazorpayScript();

      const options = {
        key: orderResponse.keyId,
        amount: Math.round(orderResponse.amount * 100), // Convert to paise
        currency: orderResponse.currency,
        name: 'EatFit247',
        description: orderResponse.notes['description'] || 'Product Order Payment',
        order_id: orderResponse.orderId,
        handler: (response: any) => {
          onSuccess(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature);
        },
        prefill: {
          name: orderResponse.customer.name,
          email: orderResponse.customer.email,
          contact: orderResponse.customer.contact
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: () => {
            onError(new Error('Payment cancelled by user'));
          }
        }
      };

      this.razorpayInstance = new window.Razorpay(options);
      this.razorpayInstance.on('payment.failed', (response: any) => {
        onError(new Error(response.error.description || 'Payment failed'));
      });
      this.razorpayInstance.open();
    } catch (error) {
      console.error('Error initializing Razorpay payment:', error);
      onError(error);
    }
  }

  /**
   * Initialize Stripe payment
   * Note: Stripe integration requires additional setup with Stripe Elements
   */
  async initializeStripePayment(
    orderResponse: PaymentOrderResponse,
    onSuccess: PaymentSuccessCallback,
    onError: PaymentErrorCallback
  ): Promise<void> {
    // TODO: Implement Stripe Elements integration
    // This requires loading Stripe.js and creating payment elements
    onError(new Error('Stripe payment integration not yet implemented'));
  }

  /**
   * Initialize Telr payment
   * Note: Telr typically uses redirect-based payment
   */
  async initializeTelrPayment(
    orderResponse: PaymentOrderResponse,
    onSuccess: PaymentSuccessCallback,
    onError: PaymentErrorCallback
  ): Promise<void> {
    // TODO: Implement Telr payment integration
    // Telr typically uses redirect-based payment flow
    onError(new Error('Telr payment integration not yet implemented'));
  }

  /**
   * Initialize payment based on gateway code
   */
  async initializePayment(
    orderResponse: PaymentOrderResponse,
    onSuccess: PaymentSuccessCallback,
    onError: PaymentErrorCallback
  ): Promise<void> {
    switch (orderResponse.gatewayCode.toUpperCase()) {
      case 'RAZORPAY':
        await this.initializeRazorpayPayment(orderResponse, onSuccess, onError);
        break;
      case 'STRIPE':
        await this.initializeStripePayment(orderResponse, onSuccess, onError);
        break;
      case 'TELR':
        await this.initializeTelrPayment(orderResponse, onSuccess, onError);
        break;
      default:
        onError(new Error(`Unsupported payment gateway: ${orderResponse.gatewayCode}`));
    }
  }
}

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

