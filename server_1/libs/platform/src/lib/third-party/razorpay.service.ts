import Razorpay from 'razorpay';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { CurrencyUtil } from '@eatfit247-shared-lib';

/** Gateway-agnostic view of a payment fetched from the gateway API. */
export interface IGatewayPaymentDetails {
  id: string;
  orderId: string | null;
  /** Gateway status, e.g. Razorpay `created` | `authorized` | `captured` | `refunded` | `failed`. */
  status: string;
  amountMinor: number;
  currency: string;
  createdAt: Date;
  raw: Record<string, unknown>;
}

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
  }

  /**
   * Get or create a Razorpay instance with credentials
   * @param keyId - Razorpay key ID (optional, uses default if not provided)
   * @param keySecret - Razorpay key secret (optional, uses default if not provided)
   * @returns Razorpay instance
   */
  private getRazorpayInstance(keyId?: string, keySecret?: string): Razorpay {
    // If credentials are provided, create a new instance with those credentials
    if (keyId && keySecret) {
      return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
    // Otherwise, use the default instance (if initialized)
    if (!this.razorpay) {
      throw new Error('Razorpay credentials not provided. Please provide keyId and keySecret.');
    }
    return this.razorpay;
  }

  async createOrder(
    amount: number,
    receipt: string,
    currency: string,
    notes?: Record<string, any>,
    keyId?: string,
    keySecret?: string,
  ) {
    const razorpay = this.getRazorpayInstance(keyId, keySecret);
    return razorpay.orders.create({
      amount: CurrencyUtil.toMinor(amount, currency),
      currency: currency.toUpperCase(),
      receipt,
      notes,
    });
  }

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
    keyId?: string,
    keySecret?: string,
  ) {
    const razorpay = this.getRazorpayInstance(keyId, keySecret);
    return razorpay.paymentLink.create({
      amount: CurrencyUtil.toMinor(amount, currency),
      currency: currency,
      description,
      customer: customer || {},
      notes: notes || {},
    });
  }

  /**
   * Cancel a payment link so it can no longer be paid.
   * Returns the link's resulting status; 'paid' means it was paid before it could be cancelled.
   */
  async cancelPaymentLink(
    paymentLinkId: string,
    keyId: string,
    keySecret: string,
  ): Promise<{ status: string }> {
    const razorpay = this.getRazorpayInstance(keyId, keySecret);
    const link = await razorpay.paymentLink.fetch(paymentLinkId);
    if (['paid', 'cancelled', 'expired'].includes(String(link.status))) {
      return { status: String(link.status) };
    }
    const cancelled = await razorpay.paymentLink.cancel(paymentLinkId);
    return { status: String(cancelled.status) };
  }

  /**
   * Fetch a payment from the Razorpay API (status, amount in minor units, order id).
   * The checkout verify path trusts this, never the browser.
   */
  async fetchPayment(
    paymentId: string,
    keyId: string,
    keySecret: string,
  ): Promise<IGatewayPaymentDetails> {
    const razorpay = this.getRazorpayInstance(keyId, keySecret);
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      id: payment.id,
      orderId: payment.order_id ?? null,
      status: payment.status,
      amountMinor: Number(payment.amount),
      currency: payment.currency,
      createdAt: new Date(Number(payment.created_at) * 1000),
      raw: payment as unknown as Record<string, unknown>,
    };
  }

  /**
   * Verify Razorpay payment signature
   * @param paymentId - Payment ID from Razorpay
   * @param orderId - Order ID from Razorpay
   * @param signature - Signature received from Razorpay
   * @param keySecret - Razorpay key secret for signature verification
   * @returns Verification result with payment details
   */
  async verifyPayment(
    paymentId: string,
    orderId: string,
    signature: string,
    keySecret?: string,
  ): Promise<{ verified: boolean; paymentDetails?: any }> {
    if (!keySecret) {
      throw new Error('Razorpay key secret is required for payment verification');
    }

    if (!paymentId || !orderId || !signature) {
      return {
        verified: false,
        paymentDetails: null,
      };
    }

    try {
      // Razorpay signature verification: HMAC SHA256 of orderId|paymentId
      const text = `${orderId}|${paymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      if (generatedSignature.length !== signature.length) {
        return {
          verified: false,
          paymentDetails: null,
        };
      }

      // Convert hex strings to buffers for timing-safe comparison
      const generatedBuffer = Buffer.from(generatedSignature, 'hex');
      const signatureBuffer = Buffer.from(signature, 'hex');

      const isSignatureValid = crypto.timingSafeEqual(
        new Uint8Array(generatedBuffer),
        new Uint8Array(signatureBuffer),
      );

      if (!isSignatureValid) {
        return {
          verified: false,
          paymentDetails: null,
        };
      }

      // If signature is valid, optionally fetch payment details from Razorpay
      // For now, we'll just return verified: true
      // You can enhance this to fetch actual payment details from Razorpay API if needed
      return {
        verified: true,
        paymentDetails: {
          paymentId,
          orderId,
          signature,
        },
      };
    } catch (error) {
      return {
        verified: false,
        paymentDetails: null,
      };
    }
  }
}

