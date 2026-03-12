import {
  IBookingRequest,
  ICourierProviderCredentials,
  IRateQuote,
  IRateRequest,
  IShipmentBookingResponse,
  ITrackingEvent,
} from '@eatfit247-shared-lib';

/**
 * Main courier provider interface
 */
export interface ICourierProvider {
  /**
   * Get shipping rates for a shipment
   */
  getRates(payload: IRateRequest, credentials: ICourierProviderCredentials): Promise<IRateQuote[]>;

  /**
   * Create/book a shipment
   */
  createShipment(
    payload: IBookingRequest,
    credentials: ICourierProviderCredentials,
  ): Promise<IShipmentBookingResponse>;

  /**
   * Track a shipment by tracking number
   */
  trackShipment(
    trackingNumber: string,
    credentials: ICourierProviderCredentials,
  ): Promise<ITrackingEvent[]>;

  /**
   * Cancel a shipment
   */
  cancelShipment(trackingNumber: string, credentials: ICourierProviderCredentials): Promise<void>;
}
