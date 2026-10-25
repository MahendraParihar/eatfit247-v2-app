import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpService } from './http.service';
import {
  IPublicCheckoutGatewayPayload,
  IPublicVerifyPaymentRequest,
  IPublicVerifyPaymentResponse,
  PaymentGatewayEnum,
} from '@eatfit247-shared-library';

export interface PaymentSuccessCallback {
  (paymentId: string, orderId: string, signature: string): void;
}

export interface PaymentErrorCallback {
  (error: Error): void;
}

interface IRazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface IRazorpayFailedResponse {
  error: { description?: string };
}

interface IRazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: IRazorpaySuccessResponse) => void;
  prefill: { name?: string; email?: string; contact?: string };
  notes: Record<string, string>;
  theme: { color: string };
  modal: { ondismiss: () => void };
}

interface IRazorpayInstance {
  on(event: 'payment.failed', handler: (response: IRazorpayFailedResponse) => void): void;
  open(): void;
}

/**
 * Embedded payment gateway integration.
 * The order and its amount always come from the server (`…/order`); this service
 * only opens the gateway for that order and asks the server to verify the result.
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly httpService = inject(HttpService);
  private readonly platformId = inject(PLATFORM_ID);
  private razorpayInstance: IRazorpayInstance | null = null;

  private getCheckoutAuthHeaders(): { [key: string]: string } {
    if (!isPlatformBrowser(this.platformId)) return {};
    const token = sessionStorage.getItem('checkoutToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

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
   * Ask the server to verify a product payment (it checks with the gateway itself)
   */
  async verifyPayment(
    memberId: number,
    verifyData: IPublicVerifyPaymentRequest
  ): Promise<IPublicVerifyPaymentResponse> {
    const res = await this.httpService.post<IPublicVerifyPaymentResponse>(
      `checkout/member/${memberId}/product/verify-payment`,
      verifyData,
      { headers: this.getCheckoutAuthHeaders() }
    );
    return res.data;
  }

  /**
   * Ask the server to verify a plan payment (it checks with the gateway itself)
   */
  async verifyPlanPayment(
    memberId: number,
    verifyData: IPublicVerifyPaymentRequest
  ): Promise<IPublicVerifyPaymentResponse> {
    const res = await this.httpService.post<IPublicVerifyPaymentResponse>(
      `checkout/plan/member/${memberId}/verify-payment`,
      verifyData,
      { headers: this.getCheckoutAuthHeaders() }
    );
    return res.data;
  }

  /**
   * Open Razorpay checkout for the server-created order
   */
  async initializeRazorpayPayment(
    gateway: IPublicCheckoutGatewayPayload,
    description: string,
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

      const options: IRazorpayOptions = {
        key: gateway.keyId,
        // Minor units of the order's currency, as computed by the server
        amount: gateway.amountMinor,
        currency: gateway.currency,
        name: 'EatFit247',
        description,
        order_id: gateway.gatewayOrderId,
        handler: (response) => {
          onSuccess(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature);
        },
        prefill: {
          name: gateway.customer.name,
          email: gateway.customer.email,
          contact: gateway.customer.contact
        },
        notes: gateway.notes,
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
      this.razorpayInstance.on('payment.failed', (response) => {
        onError(new Error(response.error.description || 'Payment failed'));
      });
      this.razorpayInstance.open();
    } catch (error) {
      console.error('Error initializing Razorpay payment:', error);
      onError(error instanceof Error ? error : new Error('Failed to open the payment gateway'));
    }
  }

  /**
   * Open the gateway checkout for the server-created order
   */
  async initializePayment(
    gateway: IPublicCheckoutGatewayPayload,
    description: string,
    onSuccess: PaymentSuccessCallback,
    onError: PaymentErrorCallback
  ): Promise<void> {
    switch (gateway.gatewayCode) {
      case PaymentGatewayEnum.RAZORPAY:
        await this.initializeRazorpayPayment(gateway, description, onSuccess, onError);
        break;
      default:
        onError(new Error(`Unsupported payment gateway: ${gateway.gatewayCode}`));
    }
  }
}

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: new (options: IRazorpayOptions) => IRazorpayInstance;
  }
}
