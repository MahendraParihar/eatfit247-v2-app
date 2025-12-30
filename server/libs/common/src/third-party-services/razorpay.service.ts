import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../app-config';
import { ConfigParam } from 'eatfit247-shared-lib';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;

  constructor(private readonly appConfigService: AppConfigService) {
    this.razorpay = new Razorpay({
      key_id: this.appConfigService.getString(ConfigParam.RAZORPAY_KEY_ID),
      key_secret: this.appConfigService.getString(ConfigParam.RAZORPAY_KEY_SECRET),
    });
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

  verifyWebhookSignature(
    payload: string,
    signature: string,
  ): boolean {
    const expected = crypto
      .createHmac('sha256', this.appConfigService.getString(ConfigParam.RAZORPAY_WEBHOOK_SECRET))
      .update(payload)
      .digest('hex');
    return expected === signature;
  }
}

