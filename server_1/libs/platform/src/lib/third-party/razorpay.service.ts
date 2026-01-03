import Razorpay from 'razorpay';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
  }

  async createOrder(
    amount: number,
    receipt: string,
    notes?: Record<string, any>,
  ) {
    return this.razorpay.orders.create({
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
  ) {
    return this.razorpay.paymentLink.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit (paise for INR)
      currency: currency || 'INR',
      description,
      customer: customer || {},
      notes: notes || {},
    });
  }
}

