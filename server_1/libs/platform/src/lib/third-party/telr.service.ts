import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TelrService {
  private readonly baseUrl: string;
  private readonly storeId: string;
  private readonly authKey: string;

  constructor(private readonly httpService: HttpService) {
    // TODO: Get these from config service
    // this.baseUrl = process.env.TELR_API_URL || 'https://secure.telr.com/gateway';
    // this.storeId = process.env.TELR_STORE_ID || '';
    // this.authKey = process.env.TELR_AUTH_KEY || '';
    this.baseUrl = '';
    this.storeId = '';
    this.authKey = '';
  }

  /**
   * Create a payment link using Telr Gateway
   * @param amount - Payment amount
   * @param currency - Currency code (e.g., 'AED', 'USD')
   * @param description - Payment description
   * @param customer - Customer details (optional)
   * @param notes - Additional metadata (optional)
   * @returns Payment link details with url and id
   */
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
  ): Promise<{ short_url: string; id: string }> {
    // TODO: Implement Telr payment link creation
    // Telr typically uses a hosted payment page approach
    // const orderId = `TELR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // const paymentData = {
    //   method: 'create',
    //   store: this.storeId,
    //   authkey: this.authKey,
    //   order: {
    //     id: orderId,
    //     amount: amount.toFixed(2),
    //     currency: currency,
    //     description: description,
    //     test: process.env.TELR_TEST_MODE === 'true' ? '1' : '0',
    //   },
    //   customer: {
    //     email: customer?.email || '',
    //     name: customer?.name || '',
    //     phone: customer?.contact || '',
    //   },
    //   return: {
    //     approved: `${process.env.FRONTEND_URL}/payment/success`,
    //     declined: `${process.env.FRONTEND_URL}/payment/declined`,
    //     cancelled: `${process.env.FRONTEND_URL}/payment/cancelled`,
    //   },
    //   metadata: notes || {},
    // };
    // const response = await firstValueFrom(
    //   this.httpService.post(`${this.baseUrl}/order.json`, paymentData),
    // );
    // return {
    //   short_url: response.data.order.url || '',
    //   id: response.data.order.ref || orderId,
    // };
    throw new Error('Telr service not yet implemented. Please configure TELR_STORE_ID, TELR_AUTH_KEY, and TELR_API_URL.');
  }

  /**
   * Create a payment order
   * @param amount - Payment amount
   * @param currency - Currency code
   * @param orderId - Order identifier
   * @param description - Order description
   * @param customer - Customer details (optional)
   * @param returnUrls - Return URLs for payment flow (optional)
   * @returns Order details
   */
  async createOrder(
    amount: number,
    currency: string,
    orderId: string,
    description: string,
    customer?: {
      name?: string;
      email?: string;
      contact?: string;
    },
    returnUrls?: {
      approved?: string;
      declined?: string;
      cancelled?: string;
    },
  ): Promise<any> {
    // TODO: Implement Telr order creation
    // const orderData = {
    //   method: 'create',
    //   store: this.storeId,
    //   authkey: this.authKey,
    //   order: {
    //     id: orderId,
    //     amount: amount.toFixed(2),
    //     currency: currency,
    //     description: description,
    //     test: process.env.TELR_TEST_MODE === 'true' ? '1' : '0',
    //   },
    //   customer: {
    //     email: customer?.email || '',
    //     name: customer?.name || '',
    //     phone: customer?.contact || '',
    //   },
    //   return: {
    //     approved: returnUrls?.approved || `${process.env.FRONTEND_URL}/payment/success`,
    //     declined: returnUrls?.declined || `${process.env.FRONTEND_URL}/payment/declined`,
    //     cancelled: returnUrls?.cancelled || `${process.env.FRONTEND_URL}/payment/cancelled`,
    //   },
    // };
    // const response = await firstValueFrom(
    //   this.httpService.post(`${this.baseUrl}/order.json`, orderData),
    // );
    // return response.data;
    throw new Error('Telr service not yet implemented');
  }

  /**
   * Verify a payment transaction
   * @param orderRef - Order reference from Telr
   * @returns Transaction verification details
   */
  async verifyPayment(orderRef: string): Promise<any> {
    // TODO: Implement Telr payment verification
    // const verifyData = {
    //   method: 'check',
    //   store: this.storeId,
    //   authkey: this.authKey,
    //   order: {
    //     ref: orderRef,
    //   },
    // };
    // const response = await firstValueFrom(
    //   this.httpService.post(`${this.baseUrl}/order.json`, verifyData),
    // );
    // return response.data;
    throw new Error('Telr service not yet implemented');
  }

  /**
   * Process a refund
   * @param orderRef - Order reference from Telr
   * @param amount - Refund amount (optional, full refund if not provided)
   * @param reason - Refund reason (optional)
   * @returns Refund details
   */
  async refund(
    orderRef: string,
    amount?: number,
    reason?: string,
  ): Promise<any> {
    // TODO: Implement Telr refund
    // const refundData: any = {
    //   method: 'refund',
    //   store: this.storeId,
    //   authkey: this.authKey,
    //   order: {
    //     ref: orderRef,
    //   },
    // };
    // if (amount) {
    //   refundData.order.amount = amount.toFixed(2);
    // }
    // if (reason) {
    //   refundData.reason = reason;
    // }
    // const response = await firstValueFrom(
    //   this.httpService.post(`${this.baseUrl}/order.json`, refundData),
    // );
    // return response.data;
    throw new Error('Telr service not yet implemented');
  }
}

