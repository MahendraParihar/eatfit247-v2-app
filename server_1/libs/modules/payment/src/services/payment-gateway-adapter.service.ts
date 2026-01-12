import { PaymentGatewayEnum } from '@eatfit247-shared-lib';
import { Injectable } from '@nestjs/common';
import { RazorpayService, StripeService, TelrService } from '@server_1/platform';

/**
 * Payment Gateway Adapter Interface
 * Defines the common contract for all payment gateway adapters
 */
export interface PaymentGatewayAdapter {
  /**
   * Create a payment link
   * @param amount - Payment amount
   * @param currency - Currency code (e.g., 'INR', 'USD')
   * @param description - Payment description
   * @param customer - Customer details (optional)
   * @param notes - Additional notes (optional)
   * @returns Payment link details with short_url and id
   */
  createPaymentLink(
    amount: number,
    currency: string,
    description: string,
    customer?: {
      name?: string;
      email?: string;
      contact?: string;
    },
    notes?: Record<string, any>,
    credentials?: {
      keyId?: string;
      keySecret?: string;
    },
  ): Promise<{ short_url: string; id: string }>;

  /**
   * Create a payment order
   * @param amount - Payment amount
   * @param receipt - Receipt identifier
   * @param currency - Currency code (optional, defaults to gateway default)
   * @param notes - Additional notes (optional)
   * @returns Order details
   */
  createOrder?(
    amount: number,
    receipt: string,
    currency?: string,
    notes?: Record<string, any>,
  ): Promise<any>;

  /**
   * Verify a payment
   * @param paymentId - Payment ID from gateway
   * @param orderId - Order ID (optional)
   * @param signature - Payment signature for verification (optional)
   * @returns Verification result
   */
  verifyPayment?(
    paymentId: string,
    orderId?: string,
    signature?: string,
  ): Promise<{ verified: boolean; paymentDetails?: any }>;

  /**
   * Process a refund
   * @param paymentId - Payment ID from gateway
   * @param amount - Refund amount (optional, full refund if not provided)
   * @param notes - Refund notes (optional)
   * @returns Refund details
   */
  refund?(
    paymentId: string,
    amount?: number,
    notes?: Record<string, any>,
  ): Promise<any>;
}

/**
 * Razorpay Payment Gateway Adapter
 * Implements PaymentGatewayAdapter for Razorpay
 */
export class RazorpayAdapter implements PaymentGatewayAdapter {
  constructor(private readonly razorpayService: RazorpayService) {}

  async createPaymentLink(
    amount: number,
    currency: string,
    description: string,
    customer?: {
      name?: string;
      email?: string;
      contact?: string;
    },
    notes?: Record<string, any>,
    credentials?: {
      keyId?: string;
      keySecret?: string;
    },
  ): Promise<{ short_url: string; id: string }> {
    return await this.razorpayService.createPaymentLink(
      amount,
      currency,
      description,
      customer,
      notes,
      credentials?.keyId,
      credentials?.keySecret,
    );
  }

  async createOrder(
    amount: number,
    receipt: string,
    currency: string = 'INR',
    notes?: Record<string, any>,
  ): Promise<any> {
    return await this.razorpayService.createOrder(amount, receipt, notes);
  }
}

/**
 * Stripe Payment Gateway Adapter
 * Implements PaymentGatewayAdapter for Stripe
 */
export class StripeAdapter implements PaymentGatewayAdapter {
  constructor(private readonly stripeService: StripeService) {}

  async createPaymentLink(
    amount: number,
    currency: string,
    description: string,
    customer?: {
      name?: string;
      email?: string;
      contact?: string;
    },
    notes?: Record<string, any>,
    credentials?: {
      keyId?: string;
      keySecret?: string;
    },
  ): Promise<{ short_url: string; id: string }> {
    return await this.stripeService.createPaymentLink(
      amount,
      currency,
      description,
      customer,
      notes,
    );
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    description: string,
    customer?: {
      name?: string;
      email?: string;
      contact?: string;
    },
    metadata?: Record<string, any>,
  ): Promise<any> {
    return await this.stripeService.createPaymentIntent(
      amount,
      currency,
      description,
      customer,
      metadata,
    );
  }

  async verifyPayment(paymentIntentId: string): Promise<{ verified: boolean; paymentDetails?: any }> {
    try {
      const paymentDetails = await this.stripeService.verifyPayment(paymentIntentId);
      return {
        verified: paymentDetails.status === 'succeeded',
        paymentDetails,
      };
    } catch (error) {
      return {
        verified: false,
        paymentDetails: null,
      };
    }
  }

  async refund(paymentIntentId: string, amount?: number, notes?: Record<string, any>): Promise<any> {
    return await this.stripeService.refund(paymentIntentId, amount, notes);
  }
}

/**
 * Telr Payment Gateway Adapter
 * Implements PaymentGatewayAdapter for Telr
 */
export class TelrAdapter implements PaymentGatewayAdapter {
  constructor(private readonly telrService: TelrService) {}

  async createPaymentLink(
    amount: number,
    currency: string,
    description: string,
    customer?: {
      name?: string;
      email?: string;
      contact?: string;
    },
    notes?: Record<string, any>,
    credentials?: {
      keyId?: string;
      keySecret?: string;
    },
  ): Promise<{ short_url: string; id: string }> {
    return await this.telrService.createPaymentLink(
      amount,
      currency,
      description,
      customer,
      notes,
    );
  }

  async createOrder(
    amount: number,
    receipt: string,
    currency: string = 'AED',
    notes?: Record<string, any>,
  ): Promise<any> {
    return await this.telrService.createOrder(
      amount,
      currency,
      receipt,
      `Order ${receipt}`,
      undefined,
      undefined,
    );
  }

  async verifyPayment(orderRef: string): Promise<{ verified: boolean; paymentDetails?: any }> {
    try {
      const paymentDetails = await this.telrService.verifyPayment(orderRef);
      return {
        verified: paymentDetails?.order?.status === '3', // Telr status 3 = approved
        paymentDetails,
      };
    } catch (error) {
      return {
        verified: false,
        paymentDetails: null,
      };
    }
  }

  async refund(orderRef: string, amount?: number, notes?: Record<string, any>): Promise<any> {
    return await this.telrService.refund(orderRef, amount, notes['reason']);
  }
}

/**
 * Payment Gateway Factory
 * Creates appropriate payment gateway adapter instances based on gateway code
 */
@Injectable()
export class PaymentGatewayFactory {
  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly stripeService: StripeService,
    private readonly telrService: TelrService,
  ) {}

  /**
   * Get a payment gateway adapter for the given gateway code
   * @param gatewayCode - Gateway code (e.g., 'RAZORPAY', 'STRIPE', 'TELR')
   * @returns PaymentGatewayAdapter instance
   * @throws Error if gateway code is not supported
   */
  getAdapter(gatewayCode: string): PaymentGatewayAdapter {
    switch (gatewayCode.toUpperCase()) {
      case PaymentGatewayEnum.RAZORPAY:
        return new RazorpayAdapter(this.razorpayService);
      case PaymentGatewayEnum.STRIPE:
        return new StripeAdapter(this.stripeService);
      case PaymentGatewayEnum.TELR:
        return new TelrAdapter(this.telrService);
      default:
        throw new Error(`Unsupported payment gateway: ${gatewayCode}`);
    }
  }
}
