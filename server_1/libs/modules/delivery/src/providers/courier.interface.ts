/**
 * Rate quote from courier provider
 */
export interface IRateQuote {
  serviceName: string;
  serviceCode?: string;
  rateAmount: number;
  currency: string;
  estimatedDays?: number;
  estimatedDeliveryDate?: Date;
  metadata?: Record<string, any>;
}

/**
 * Shipment booking response from courier provider
 */
export interface IShipmentBookingResponse {
  providerShipmentId: string;
  trackingNumber: string;
  trackingUrl?: string;
  labelUrl?: string;
  awbNumber?: string;
  status: string;
  metadata?: Record<string, any>;
}

/**
 * Tracking event from courier provider
 */
export interface ITrackingEvent {
  status: string;
  description: string;
  eventTime: Date;
  location?: string;
  metadata?: Record<string, any>;
}

/**
 * Courier provider account credentials
 */
export interface ICourierProviderCredentials {
  providerAccountId: number;
  apiBaseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
  authToken?: string;
  tokenExpiry?: Date;
  authType: 'API_KEY' | 'JWT' | 'BASIC';
}

/**
 * Main courier provider interface
 */
export interface ICourierProvider {
  /**
   * Get shipping rates for a shipment
   */
  getRates(payload: any, credentials: ICourierProviderCredentials): Promise<IRateQuote[]>;

  /**
   * Create/book a shipment
   */
  createShipment(payload: any, credentials: ICourierProviderCredentials): Promise<IShipmentBookingResponse>;

  /**
   * Track a shipment by tracking number
   */
  trackShipment(trackingNumber: string, credentials: ICourierProviderCredentials): Promise<ITrackingEvent[]>;

  /**
   * Cancel a shipment
   */
  cancelShipment(trackingNumber: string, credentials: ICourierProviderCredentials): Promise<void>;
}

