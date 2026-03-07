import {
  ICourierProviderCredentials,
  IRateQuote,
  IShipmentBookingResponse,
  ITrackingEvent,
} from '@eatfit247-shared-lib';
import { BookingRequestDto, RateRequestDto } from '../dto';

/**
 * Courier provider account credentials
 */

/**
 * Main courier provider interface
 */
export interface ICourierProvider {
  /**
   * Get shipping rates for a shipment
   */
  getRates(
    payload: RateRequestDto,
    credentials: ICourierProviderCredentials,
  ): Promise<IRateQuote[]>;

  /**
   * Create/book a shipment
   */
  createShipment(
    payload: BookingRequestDto,
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
