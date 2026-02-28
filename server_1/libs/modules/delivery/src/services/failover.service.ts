import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize, Transaction } from 'sequelize';
import { MstCourierProvider, TxnCourierProviderAccount, TxnShipment } from '../models';
import { ShipmentRepository } from '../repositories';
import {
  CourierFactory,
  ICourierProviderCredentials,
  IShipmentBookingResponse,
} from '../providers';
import { IShipmentMetaData } from '@eatfit247-shared-lib';

/**
 * Failover Service
 *
 * Responsibilities:
 * - Implements production-safe booking algorithm with failover
 * - Tries providers in priority order
 * - Handles network errors, 5xx (retry next), 4xx (business error, break)
 * - Logs every attempt
 * - Updates shipment with transaction
 * - Marks shipment as FAILED if all providers fail
 */
@Injectable()
export class FailoverService {
  private readonly logger = new Logger(FailoverService.name);

  constructor(
    @InjectModel(TxnShipment)
    private readonly shipmentModel: typeof TxnShipment,
    @InjectModel(TxnCourierProviderAccount)
    private readonly courierProviderAccountModel: typeof TxnCourierProviderAccount,
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly shipmentRepository: ShipmentRepository,
    private readonly courierFactory: CourierFactory,
  ) {}

  /**
   * Handle failover booking - tries providers in priority order until one succeeds
   *
   * Rules:
   * - Fetch providers ordered by priority
   * - Loop providers
   * - Try booking
   * - If network error → retry next provider
   * - If 5xx → retry next provider
   * - If 4xx → break loop (business error)
   * - Log every attempt
   * - Update shipment with provider_id, tracking_number, rate_amount, status BOOKED
   * - If all fail: mark shipment FAILED, increment retry_count, store last_error
   * - Use transaction for booking update
   */
  public async handleFailover(shipmentId: number): Promise<void> {
    // Get shipment with details
    const shipment = await this.shipmentModel.scope('details').findByPk(shipmentId);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }
    this.logger.log(`Starting failover booking for shipment ${shipmentId}`);
    // Fetch providers ordered by priority
    const providers = await this.shipmentRepository.getProvidersByPriority(shipment.franchiseId);
    if (providers.length === 0) {
      this.logger.error(`No active providers found for franchise ${shipment.franchiseId}`);
      await this.markShipmentFailed(shipmentId, 'No active providers available');
      return;
    }
    // Build booking payload from shipment
    const bookingPayload = this.buildBookingPayload(shipment);
    // Loop through providers in priority order
    let lastError: string | null = null;
    let attemptedProviders: string[] = [];
    for (const provider of providers) {
      // Get a provider account for this franchise
      const providerAccount = await this.courierProviderAccountModel.findOne({
        where: {
          providerId: provider.providerId,
          franchiseId: shipment.franchiseId,
          active: true,
        },
        include: [
          {
            model: MstCourierProvider,
            as: 'provider',
            required: true,
          },
        ],
      });
      if (!providerAccount) {
        this.logger.warn(
          `No active account found for provider ${provider.providerCode} and franchise ${shipment.franchiseId}, skipping`,
        );
        continue;
      }
      attemptedProviders.push(provider.providerCode);
      this.logger.log(
        `Attempting booking with provider ${provider.providerCode} (priority ${provider.priorityOrder}) for shipment ${shipmentId}`,
      );
      try {
        // Try booking with this provider
        const bookingResult = await this.attemptBooking(provider, providerAccount, bookingPayload);
        // Validate booking actually succeeded - provider may return 200 with status: false
        if (!this.isBookingSuccess(bookingResult)) {
          const msg =
            (typeof bookingResult.status === 'boolean'
              ? `Provider returned status: ${bookingResult.status}`
              : bookingResult.message || `Provider returned status: ${bookingResult.status}`) ||
            'Booking failed';
          throw new Error(msg);
        }
        // Success! Update shipment with transaction
        await this.updateShipmentAfterBooking(shipmentId, provider, providerAccount, bookingResult);
        this.logger.log(
          `Successfully booked shipment ${shipmentId} with provider ${provider.providerCode}`,
        );
        return; // Exit on success
      } catch (error: any) {
        // Determine error type and handle accordingly
        const errorInfo = this.analyzeError(error);
        lastError = errorInfo.message;
        this.logger.warn(
          `Booking attempt failed with provider ${provider.providerCode} for shipment ${shipmentId}: ${errorInfo.message}`,
        );
        // If 4xx error (business error), break loop
        if (errorInfo.isBusinessError) {
          this.logger.error(
            `Business error (4xx) with provider ${provider.providerCode}, stopping failover for shipment ${shipmentId}`,
          );
          break;
        }
        // If network error or 5xx, continue to next provider
        // (loop continues)
      }
    }
    // All providers failed
    this.logger.error(
      `All booking attempts failed for shipment ${shipmentId}. Attempted providers: ${attemptedProviders.join(
        ', ',
      )}`,
    );
    await this.markShipmentFailed(shipmentId, lastError || 'All providers failed');
  }

  /**
   * Check if booking response indicates success.
   * Providers may return HTTP 200 with status: false when booking fails.
   */
  private isBookingSuccess(result: IShipmentBookingResponse): boolean {
    const s = result?.status;
    if (s === false) return false;
    if (typeof s === 'string') {
      const lower = s.toLowerCase();
      if (lower === 'false' || lower === 'failed' || lower === 'error' || lower === 'fail') {
        return false;
      }
    }
    // Must have tracking number for successful booking
    if (!result?.trackingNumber?.trim?.()) return false;
    return true;
  }

  /**
   * Attempt booking with a specific provider
   */
  private async attemptBooking(
    provider: MstCourierProvider,
    providerAccount: TxnCourierProviderAccount,
    bookingPayload: any,
  ): Promise<IShipmentBookingResponse> {
    // Get provider adapter
    const adapter = this.courierFactory.getAdapter(provider.providerCode);
    // Build credentials
    const credentials = await this.buildCredentials(providerAccount, provider);
    // Call provider's createShipment API
    return await adapter.createShipment(bookingPayload, credentials);
  }

  /**
   * Update shipment after successful booking (with transaction)
   */
  private async updateShipmentAfterBooking(
    shipmentId: number,
    provider: MstCourierProvider,
    providerAccount: TxnCourierProviderAccount,
    bookingResult: IShipmentBookingResponse,
  ): Promise<void> {
    const transaction: Transaction = await this.sequelize.transaction();
    try {
      // Get the selected rate if available
      const shipment = await this.shipmentModel.findByPk(shipmentId, { transaction });
      if (!shipment) {
        throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
      }
      // Update shipment with booking details using transaction
      await this.shipmentModel.update(
        {
          providerId: provider.providerId,
          providerAccountId: providerAccount.providerAccountId,
          providerShipmentId: bookingResult.providerShipmentId,
          trackingNumber: bookingResult.trackingNumber,
          trackingUrl: bookingResult.trackingUrl,
          status: 'BOOKED',
          rateAmount: shipment.rateAmount, // Keep existing rate amount
          currency: shipment.currency || 'INR',
          metaData: {
            ...shipment.metaData,
            bookingResponse: bookingResult.metadata,
            labelUrl: bookingResult.labelUrl,
            awbNumber: bookingResult.awbNumber,
          },
        },
        {
          where: { shipmentId },
          transaction,
        },
      );
      await transaction.commit();
      this.logger.log(`Shipment ${shipmentId} updated successfully with booking details`);
    } catch (error) {
      await transaction.rollback();
      this.logger.error(`Failed to update shipment ${shipmentId} after booking: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark shipment as failed with error message
   */
  private async markShipmentFailed(shipmentId: number, errorMessage: string): Promise<void> {
    const transaction: Transaction = await this.sequelize.transaction();
    try {
      const shipment = await this.shipmentModel.findByPk(shipmentId, { transaction });
      if (!shipment) {
        throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
      }
      // Update shipment with transaction
      await this.shipmentModel.update(
        {
          status: 'FAILED',
          lastError: errorMessage,
          retryCount: (shipment.retryCount || 0) + 1,
        },
        {
          where: { shipmentId },
          transaction,
        },
      );
      await transaction.commit();
      this.logger.log(`Shipment ${shipmentId} marked as FAILED`);
    } catch (error) {
      await transaction.rollback();
      this.logger.error(`Failed to mark shipment ${shipmentId} as failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze error to determine if it's a network error, 5xx, or 4xx
   */
  private analyzeError(error: any): {
    message: string;
    isNetworkError: boolean;
    isServerError: boolean;
    isBusinessError: boolean;
  } {
    let message = error.message || 'Unknown error';
    let isNetworkError = false;
    let isServerError = false;
    let isBusinessError = false;
    // Check for network errors
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET' ||
      error.message?.includes('timeout') ||
      error.message?.includes('network') ||
      error.message?.includes('connection')
    ) {
      isNetworkError = true;
      message = `Network error: ${message}`;
    }
    // Check for HTTP errors
    // Check if the error has a response with the status code
    if (error.response?.status) {
      const statusCode = error.response.status;
      if (statusCode >= 500) {
        isServerError = true;
        message = `Server error (${statusCode}): ${message}`;
      } else if (statusCode >= 400 && statusCode < 500) {
        isBusinessError = true;
        message = `Business error (${statusCode}): ${message}`;
      }
    }
    // Check if error has statusCode property
    else if (error.statusCode) {
      const statusCode = error.statusCode;
      if (statusCode >= 500) {
        isServerError = true;
        message = `Server error (${statusCode}): ${message}`;
      } else if (statusCode >= 400 && statusCode < 500) {
        isBusinessError = true;
        message = `Business error (${statusCode}): ${message}`;
      }
    }
    return {
      message,
      isNetworkError,
      isServerError,
      isBusinessError,
    };
  }

  /**
   * Build booking payload from shipment data
   */
  private buildBookingPayload(shipment: TxnShipment): any {
    // Get shipment items
    const items = shipment.shipmentItems || [];
    // Calculate total weight from items or use shipment totalWeightKg
    const weight = shipment.totalWeightKg || 1;
    const metadata = shipment.metaData;
    return <IShipmentMetaData>{
      orderId: shipment.metaData?.orderId || shipment.shipmentNumber,
      orderDate: shipment.createdAt,
      pickup: metadata.pickup,
      delivery: metadata.delivery,
      billing: metadata.billing,
      shipping: metadata.shipping,
      weight: weight,
      dimensions: metadata.dimensions,
      codAmount: shipment.metaData?.codAmount || 0,
      subTotal: shipment.totalAmount || 0,
      items: items.map((item: any) => ({
        name: item.productName || 'Product',
        sku: item.sku || '',
        quantity: item.quantity || 1,
        price: item.unitPrice || 0,
        weight: item.weightKg || 0,
      })),
    };
  }

  /**
   * Build credentials object from provider account
   */
  private async buildCredentials(
    account: TxnCourierProviderAccount,
    provider: MstCourierProvider,
  ): Promise<ICourierProviderCredentials> {
    const credentials: ICourierProviderCredentials = {
      providerAccountId: account.providerAccountId,
      apiBaseUrl: account.apiBaseUrl,
      authType: provider.authType,
    };
    switch (provider.authType) {
      case 'API_KEY':
        credentials.apiKey = account.apiKey;
        credentials.apiSecret = account.apiSecret;
        break;
      case 'JWT':
        credentials.authToken = account.authToken;
        credentials.tokenExpiry = account.tokenExpiry;
        credentials.username = account.username;
        credentials.password = account.passwordEncrypted;
        break;
      case 'BASIC':
        credentials.username = account.username;
        credentials.password = undefined;
        break;
    }
    return credentials;
  }

  /**
   * Retry failed operation (legacy method, kept for backward compatibility)
   */
  public async retryFailedOperation(shipmentId: number, maxRetries: number = 3): Promise<void> {
    const shipment = await this.shipmentModel.findByPk(shipmentId);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }
    if (shipment.retryCount >= maxRetries) {
      await this.markShipmentFailed(shipmentId, 'Maximum retry count exceeded');
      return;
    }
    // Increment retry count and retry booking
    await shipment.update({
      retryCount: shipment.retryCount + 1,
    });
    // Retry booking with failover
    await this.handleFailover(shipmentId);
  }
}
