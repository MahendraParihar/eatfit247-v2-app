import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  TxnShipment,
  TxnShipmentRateQuote,
  TxnCourierProviderAccount,
  MstCourierProvider,
  TxnShipmentItem,
} from '../models';
import { ShipmentRepository } from '../repositories';
import { RateRepository } from '../repositories';
import { CourierFactory } from '../providers';
import { ICourierProviderCredentials } from '../providers';
import { IRateQuote, IShipmentMetaData } from '@eatfit247-shared-lib';

/**
 * Rate Service
 *
 * Responsibilities:
 * - Fetch active providers by priority
 * - Call rate APIs in parallel
 * - Catch and ignore provider-specific failures
 * - Save all rate responses
 * - Update shipment status to RATE_REQUESTED
 * - Never block if one provider fails
 */
@Injectable()
export class RateService {
  private readonly logger = new Logger(RateService.name);

  constructor(
    @InjectModel(TxnShipment)
    private readonly shipmentModel: typeof TxnShipment,
    @InjectModel(TxnShipmentRateQuote)
    private readonly rateQuoteModel: typeof TxnShipmentRateQuote,
    @InjectModel(TxnCourierProviderAccount)
    private readonly providerAccountModel: typeof TxnCourierProviderAccount,
    private readonly shipmentRepository: ShipmentRepository,
    private readonly rateRepository: RateRepository,
    private readonly courierFactory: CourierFactory,
  ) {}

  /**
   * Request rates from all active providers for a shipment
   * Calls rate APIs in parallel and saves all successful responses
   * Never blocks if one provider fails
   */
  public async requestRates(shipmentId: number): Promise<IRateQuote[]> {
    // Get shipment with items
    const shipment = await this.shipmentModel.scope('details').findByPk(shipmentId);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }
    // Get active providers by priority for the franchise
    const providers = await this.shipmentRepository.getProvidersByPriority(shipment.franchiseId);
    // Filter providers that support rate API
    const rateSupportedProviders = providers.filter((p) => p.supportsRateApi);
    if (rateSupportedProviders.length === 0) {
      this.logger.warn(
        `No active providers with rate API support found for franchise ${shipment.franchiseId}`,
      );
      // Still update the status to RATE_REQUESTED even if no providers
      await this.shipmentRepository.updateStatus(shipmentId, 'RATE_REQUESTED');
      return [];
    }
    // Build rate request payload from shipment
    const ratePayload = this.buildRatePayload(shipment);
    // Call rate APIs in parallel for all providers
    const ratePromises = rateSupportedProviders.map((provider) =>
      this.getRatesFromProvider(provider, shipment.franchiseId, ratePayload, shipmentId).catch(
        (error) => {
          // Log error but don't throw - we want to continue with other providers
          this.logger.error(
            `Failed to get rates from provider ${provider.providerCode} for shipment ${shipmentId}: ${error.message}`,
            error.stack,
          );
          return null; // Return null to indicate failure
        },
      ),
    );
    // Wait for all rate requests to complete (success or failure)
    await Promise.allSettled(ratePromises);
    // Update shipment status to RATE_REQUESTED
    await this.shipmentRepository.updateStatus(shipmentId, 'RATE_REQUESTED');
    // Return all saved rate quotes ordered by amount
    return await this.rateRepository.findByShipmentId(shipmentId);
  }

  /**
   * Get rates from a single provider
   * Returns array of saved rate quotes or throws error
   */
  private async getRatesFromProvider(
    provider: MstCourierProvider,
    franchiseId: number,
    ratePayload: any,
    shipmentId: number,
  ): Promise<TxnShipmentRateQuote[]> {
    // Get a provider account for this franchise
    const providerAccount = await this.providerAccountModel.findOne({
      where: {
        providerId: provider.providerId,
        franchiseId,
        active: true,
      },
    });
    if (!providerAccount) {
      throw new Error(
        `No active account found for provider ${provider.providerCode} and franchise ${franchiseId}`,
      );
    }
    // Get provider adapter
    const adapter = this.courierFactory.getAdapter(provider.providerCode);
    // Build credentials
    const credentials = await this.buildCredentials(providerAccount, provider);
    // Call provider's rate API
    const rateQuotes: IRateQuote[] = await adapter.getRates(ratePayload, credentials);
    const quotes = [];
    for (const quote of rateQuotes) {
      quotes.push({
        shipmentId: shipmentId,
        providerId: provider.providerId,
        providerAccountId: providerAccount.providerAccountId,
        serviceName: quote.serviceName,
        estimatedDays: quote.estimatedDays,
        rateAmount: quote.rateAmount,
        currency: quote.currency || 'INR',
        isSelected: false,
        rawResponse: {
          serviceCode: quote.serviceCode,
          estimatedDeliveryDate: quote.estimatedDeliveryDate,
          metadata: quote.metadata,
        },
      });
    }
    const savedQuotes: TxnShipmentRateQuote[] = await this.rateQuoteModel.bulkCreate(quotes);
    this.logger.log(
      `Successfully retrieved ${savedQuotes.length} rate quotes from ${provider.providerCode} for shipment ${shipmentId}`,
    );
    return savedQuotes;
  }

  /**
   * Build rate request payload from shipment data
   */
  private buildRatePayload(shipment: TxnShipment): IShipmentMetaData {
    // Calculate total weight from items or use shipment totalWeightKg
    const weight = shipment.totalWeightKg || 1;
    const metadata = shipment.metaData;
    return <IShipmentMetaData>{
      pickup: metadata.pickup,
      delivery: metadata.delivery,
      weight,
      dimensions: metadata.dimensions,
      codAmount: shipment.metaData?.codAmount || 0,
      orderId: shipment.metaData?.orderId || shipment.shipmentNumber,
    };
  }

  /**
   * Build credentials object from a provider account
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
        credentials.password = account.passwordEncrypted;
        credentials.username = account.username;
        break;
      case 'BASIC':
        credentials.username = account.username;
        credentials.password = undefined;
        break;
    }
    return credentials;
  }

  public async selectRate(shipmentId: number, rateQuoteId: number): Promise<TxnShipment> {
    const shipment = await this.shipmentModel.findByPk(shipmentId);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }
    const rateQuote = await this.rateQuoteModel.findByPk(rateQuoteId);
    if (!rateQuote) {
      throw new NotFoundException(`Rate quote with ID ${rateQuoteId} not found`);
    }
    // Unselect all other rates for this shipment
    await this.rateQuoteModel.update({ isSelected: false }, { where: { shipmentId } });
    // Select the chosen rate
    await this.rateRepository.update(rateQuoteId, { isSelected: true });
    // Update shipment with selected rate
    await this.shipmentRepository.update(shipmentId, {
      status: 'RATE_SELECTED',
      providerId: rateQuote.providerId,
      providerAccountId: rateQuote.providerAccountId,
      rateAmount: rateQuote.rateAmount,
      currency: rateQuote.currency,
    });
    return this.shipmentModel.scope('details').findByPk(shipmentId);
  }
}
