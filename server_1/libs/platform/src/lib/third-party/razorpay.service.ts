import Razorpay from 'razorpay';
import { Injectable } from '@nestjs/common';

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
    notes?: Record<string, any>,
    keyId?: string,
    keySecret?: string,
  ) {
    const razorpay = this.getRazorpayInstance(keyId, keySecret);
    return razorpay.orders.create({
      amount: Math.round(amount * 100), // INR → paise
      currency: 'INR',
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
      amount: Math.round(amount * 100), // Convert to smallest currency unit (paise for INR)
      currency: currency || 'INR',
      description,
      customer: customer || {},
      notes: notes || {},
    });
  }
}

