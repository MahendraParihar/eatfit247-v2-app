import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import { AppConfigService } from '@server_1/core';
import {
  ConfigParam,
  ICreateWooCommerceOrderDto,
  IWooCommerceBillingAddress,
  IWooCommerceOrder,
  IWooCommerceShippingAddress,
} from '@eatfit247-shared-lib';

@Injectable()
export class WooCommerceService {
  private readonly baseUrl: string;
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly apiVersion: string;

  constructor(
    private readonly httpService: HttpService,
    private appConfigService: AppConfigService,
  ) {
    this.baseUrl = this.appConfigService.getString(ConfigParam.WOOCOMMERCE_BASE_URL);
    this.consumerKey = this.appConfigService.getString(ConfigParam.WOOCOMMERCE_CONSUMER_KEY);
    this.consumerSecret = this.appConfigService.getString(ConfigParam.WOOCOMMERCE_CONSUMER_SECRET);
    this.apiVersion = this.appConfigService.getString(ConfigParam.WOOCOMMERCE_API_VERSION);

    if (!this.baseUrl || !this.consumerKey || !this.consumerSecret) {
      console.warn(
        'WooCommerce credentials not configured. Please set WOOCOMMERCE_BASE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET environment variables.',
      );
    }
  }

  /**
   * Get authentication config for WooCommerce API requests
   */
  private getAuthConfig(): AxiosRequestConfig {
    return {
      auth: {
        username: this.consumerKey,
        password: this.consumerSecret,
      },
    };
  }

  /**
   * Get the base API URL
   */
  private getApiUrl(): string {
    const baseUrl = this.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    return `${baseUrl}/wp-json/wc/${this.apiVersion}`;
  }

  /**
   * Create an order in WooCommerce
   * @param orderData - Order data to create
   * @returns Created order details
   */
  async createOrder(orderData: ICreateWooCommerceOrderDto): Promise<IWooCommerceOrder> {
    if (!this.baseUrl || !this.consumerKey || !this.consumerSecret) {
      throw new Error(
        'WooCommerce service not configured. Please set WOOCOMMERCE_BASE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET environment variables.',
      );
    }

    try {
      const url = `${this.getApiUrl()}/orders`;
      const response = await firstValueFrom(
        this.httpService.post<IWooCommerceOrder>(url, orderData, this.getAuthConfig()),
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to create WooCommerce order';
      throw new Error(`WooCommerce API Error: ${errorMessage}`);
    }
  }

  /**
   * Get order details by order ID
   * @param orderId - WooCommerce order ID
   * @returns Order details
   */
  async getOrderById(orderId: number): Promise<IWooCommerceOrder> {
    if (!this.baseUrl || !this.consumerKey || !this.consumerSecret) {
      throw new Error(
        'WooCommerce service not configured. Please set WOOCOMMERCE_BASE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET environment variables.',
      );
    }

    try {
      const url = `${this.getApiUrl()}/orders/${orderId}`;
      const response = await firstValueFrom(
        this.httpService.get<IWooCommerceOrder>(url, this.getAuthConfig()),
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Order with ID ${orderId} not found`);
      }
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch WooCommerce order';
      throw new Error(`WooCommerce API Error: ${errorMessage}`);
    }
  }

  /**
   * Track order status by order ID
   * @param orderId - WooCommerce order ID
   * @returns Order tracking information including status
   */
  async trackOrder(orderId: number): Promise<{
    order_id: number;
    status: string;
    date_created: string;
    date_modified: string;
    date_completed: string | null;
    date_paid: string | null;
    total: string;
    currency: string;
    billing: IWooCommerceBillingAddress;
    shipping: IWooCommerceShippingAddress;
    line_items: Array<{
      id: number;
      name: string;
      product_id: number;
      quantity: number;
      total: string;
    }>;
    tracking_number?: string;
    tracking_url?: string;
  }> {
    if (!this.baseUrl || !this.consumerKey || !this.consumerSecret) {
      throw new Error(
        'WooCommerce service not configured. Please set WOOCOMMERCE_BASE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET environment variables.',
      );
    }

    try {
      const order = await this.getOrderById(orderId);

      // Extract tracking information from meta_data if available
      const trackingNumber = order.meta_data.find(
        (meta) => meta.key === '_tracking_number' || meta.key === 'tracking_number',
      )?.value as string | undefined;

      const trackingUrl = order.meta_data.find(
        (meta) => meta.key === '_tracking_url' || meta.key === 'tracking_url',
      )?.value as string | undefined;

      return {
        order_id: order.id,
        status: order.status,
        date_created: order.date_created,
        date_modified: order.date_modified,
        date_completed: order.date_completed,
        date_paid: order.date_paid,
        total: order.total,
        currency: order.currency,
        billing: order.billing,
        shipping: order.shipping,
        line_items: order.line_items.map((item) => ({
          id: item.id,
          name: item.name,
          product_id: item.product_id,
          quantity: item.quantity,
          total: item.total,
        })),
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Update order status
   * @param orderId - WooCommerce order ID
   * @param status - New order status (e.g., 'processing', 'completed', 'cancelled')
   * @returns Updated order details
   */
  async updateOrderStatus(orderId: number, status: string): Promise<IWooCommerceOrder> {
    if (!this.baseUrl || !this.consumerKey || !this.consumerSecret) {
      throw new Error(
        'WooCommerce service not configured. Please set WOOCOMMERCE_BASE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET environment variables.',
      );
    }

    try {
      const url = `${this.getApiUrl()}/orders/${orderId}`;
      const response = await firstValueFrom(
        this.httpService.put<IWooCommerceOrder>(url, { status }, this.getAuthConfig()),
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to update WooCommerce order status';
      throw new Error(`WooCommerce API Error: ${errorMessage}`);
    }
  }
}

