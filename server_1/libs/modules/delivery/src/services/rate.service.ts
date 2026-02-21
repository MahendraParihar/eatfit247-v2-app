import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnShipment, TxnShipmentRateQuote, TxnCourierProviderAccount, MstCourierProvider } from '../models';
import { ShipmentRepository } from '../repositories/shipment.repository';
import { RateRepository } from '../repositories/rate.repository';
import { CourierFactory } from '../providers/courier.factory';
import { ICourierProviderCredentials, IRateQuote } from '../providers/courier.interface';

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
  public async requestRates(shipmentId: number): Promise<TxnShipmentRateQuote[]> {
    // Get shipment with items
    const shipment = await this.shipmentModel.scope('details').findByPk(shipmentId);
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    // Get active providers by priority for the franchise
    const providers = await this.shipmentRepository.getProvidersByPriority(shipment.franchiseId);
    
    // Filter providers that support rate API
    const rateSupportedProviders = providers.filter(p => p.supportsRateApi);

    if (rateSupportedProviders.length === 0) {
      this.logger.warn(`No active providers with rate API support found for franchise ${shipment.franchiseId}`);
      // Still update status to RATE_REQUESTED even if no providers
      await this.shipmentRepository.updateStatus(shipmentId, 'RATE_REQUESTED');
      return [];
    }

    // Build rate request payload from shipment
    const ratePayload = this.buildRatePayload(shipment);

    // Call rate APIs in parallel for all providers
    const ratePromises = rateSupportedProviders.map(provider =>
      this.getRatesFromProvider(provider, shipment.franchiseId, ratePayload, shipmentId)
        .catch(error => {
          // Log error but don't throw - we want to continue with other providers
          this.logger.error(
            `Failed to get rates from provider ${provider.providerCode} for shipment ${shipmentId}: ${error.message}`,
            error.stack,
          );
          return null; // Return null to indicate failure
        })
    );

    // Wait for all rate requests to complete (success or failure)
    const rateResults = await Promise.allSettled(ratePromises);

    // Collect all successful rate quotes
    const allRateQuotes: TxnShipmentRateQuote[] = [];
    
    for (const result of rateResults) {
      if (result.status === 'fulfilled' && result.value !== null) {
        // result.value is an array of rate quotes from one provider
        allRateQuotes.push(...result.value);
      }
    }

    // Update shipment status to RATE_REQUESTED
    await this.shipmentRepository.updateStatus(shipmentId, 'RATE_REQUESTED');

    // Return all saved rate quotes ordered by amount
    return this.rateRepository.findByShipmentId(shipmentId);
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
    // Get provider account for this franchise
    const providerAccount = await this.providerAccountModel.findOne({
      where: {
        providerId: provider.providerId,
        franchiseId,
        active: true,
      },
    });

    if (!providerAccount) {
      throw new Error(`No active account found for provider ${provider.providerCode} and franchise ${franchiseId}`);
    }

    // Get provider adapter
    const adapter = this.courierFactory.getAdapter(provider.providerCode);

    // Build credentials
    const credentials = await this.buildCredentials(providerAccount, provider);

    // Call provider's rate API
    const rateQuotes: IRateQuote[] = await adapter.getRates(ratePayload, credentials);

    // Save all rate quotes to database
    const savedQuotes: TxnShipmentRateQuote[] = [];
    for (const quote of rateQuotes) {
      const savedQuote = await this.rateRepository.create({
        shipmentId,
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
      savedQuotes.push(savedQuote);
    }

    this.logger.log(
      `Successfully retrieved ${savedQuotes.length} rate quotes from ${provider.providerCode} for shipment ${shipmentId}`,
    );

    return savedQuotes;
  }

  /**
   * Build rate request payload from shipment data
   */
  private buildRatePayload(shipment: TxnShipment): any {
    // Get shipment items to calculate total weight and dimensions
    const items = (shipment as any).shipmentItems || [];
    
    // Calculate total weight from items or use shipment totalWeightKg
    const weight = shipment.totalWeightKg || 
      items.reduce((sum: number, item: any) => sum + (item.weightKg || 0), 0) || 1; // Default to 1kg if no weight

    // Build pickup and delivery addresses from metadata or use defaults
    // Addresses should be in shipment.metadata or fetched from order
    const metadata = shipment.metadata || {};
    
    const payload: any = {
      pickup: metadata.pickup || {
        postcode: metadata.pickupPostcode || '',
        address: metadata.pickupAddress || '',
        city: metadata.pickupCity || '',
        state: metadata.pickupState || '',
        name: metadata.pickupName || '',
        phone: metadata.pickupPhone || '',
      },
      delivery: metadata.delivery || {
        postcode: metadata.deliveryPostcode || '',
        address: metadata.deliveryAddress || '',
        city: metadata.deliveryCity || '',
        state: metadata.deliveryState || '',
        name: metadata.deliveryName || '',
        phone: metadata.deliveryPhone || '',
      },
      weight,
      dimensions: metadata.dimensions || {
        length: metadata.length || 10,
        breadth: metadata.breadth || metadata.width || 10,
        height: metadata.height || 10,
      },
      codAmount: shipment.codAmount || 0,
      orderId: shipment.orderId,
    };

    return payload;
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

    // Add credentials based on auth type
    if (provider.authType === 'API_KEY') {
      credentials.apiKey = account.apiKey || undefined;
      credentials.apiSecret = account.apiSecret || undefined;
    } else if (provider.authType === 'JWT') {
      credentials.authToken = account.authToken || undefined;
      credentials.tokenExpiry = account.tokenExpiry || undefined;
    } else if (provider.authType === 'BASIC') {
      credentials.username = account.username || undefined;
      // Note: passwordEncrypted is bcrypt hashed (one-way), so it cannot be used for API calls
      // If BASIC auth is needed, the password should be stored in a decryptable format
      // For now, we'll use it as-is and let the adapter handle the error if it fails
      // This may need to be addressed by storing passwords in an encrypted (decryptable) format
      credentials.password = account.passwordEncrypted || undefined;
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
    await this.rateQuoteModel.update(
      { isSelected: false },
      { where: { shipmentId } },
    );

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

