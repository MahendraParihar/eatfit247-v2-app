import { IRateQuote } from '@eatfit247-shared-lib';

export interface INimbusServiceabilityPayload {
  origin: number;
  destination: number;
  payment_type: 'cod' | 'prepaid';
  order_amount: number;
  weight?: number; // Weight in grams. Default: 500
  length?: number; // Package length in cm. Default: 10
  breadth?: number; //Package breadth in cm. Default: 10
  height?: number; //Package height in cm. Default: 10
}

export interface INimbusServiceabilityDataItem {
  id: string;
  name: string;
  freight_charges: number;
  cod_charges: number;
  total_charges: number;
  min_weight: number;
  chargeable_weight: number;
}

export interface INimbusServiceabilityResponse {
  status: boolean;
  data: INimbusServiceabilityDataItem[];
}

export interface IShipRocketServiceabilityPayload {
  pickup_postcode: number;
  delivery_postcode: number;
  order_id?: number;
  cod?: boolean;
  declared_value?: number; //The price of the order shipment in rupees.
  weight?: number; //The weight of the shipment in kgs.
  length?: number; //The length of the shipment in cms.
  breadth?: number; //The breadth of the shipment in cms.
  height?: number; //The height of the shipment in cms.
  mode?: string; //The mode of travel. Either: Surface or Air
  is_return?: boolean; //Whether the order is a return order or not. 1 in case of Yes and 0 for No. (declared_value field is required in case you use this parameter)
  couriers_type?: number; //Use this to filter out and show only "documents" couriers like XB documents, etc. The only accepted value is 1.
  only_local?: number; //Use this to filter out and show only Hyperlocal couriers. The only accepted value is 1.
  qc_check?: number; //Use this filter to show only the QC-enabled couriers. is_return has to be set to 1
}

export interface ICovidZones {
  delivery_zone: string | null;
  pickup_zone: string | null;
}

export interface ISuppressionDates {
  action_on: string;
  delay_remark: string;
  delivery_delay_by: number;
  delivery_delay_days: string;
  delivery_delay_from: string;
  delivery_delay_to: string;
  pickup_delay_by: number;
  pickup_delay_days: string;
  pickup_delay_from: string;
  pickup_delay_to: string;
}

export interface IAvailableCourierCompany {
  air_max_weight: string;
  assured_amount: number;
  base_courier_id: number | null;
  base_weight: string;
  blocked: number;
  call_before_delivery: string;
  charge_weight: number;
  city: string;
  cod: number;
  cod_charges: number;
  cod_multiplier: number;
  cost: string;
  courier_company_id: number;
  courier_name: string;
  courier_type: string;
  coverage_charges: number;
  cutoff_time: string;
  delivery_boy_contact: string;
  delivery_performance: number;
  description: string;
  edd: string;
  entry_tax: number;
  estimated_delivery_days: string;
  etd: string;
  etd_hours: number;
  freight_charge: number;
  id: number;
  is_custom_rate: number;
  is_hyperlocal: boolean;
  is_international: number;
  is_rto_address_available: boolean;
  is_surface: boolean;
  local_region: number;
  metro: number;
  min_weight: number;
  mode: number;
  new_edd: number;
  odablock: boolean;
  other_charges: number;
  others: string; // JSON string
  pickup_availability: string;
  pickup_performance: number;
  pickup_priority: string;
  pickup_supress_hours: number;
  pod_available: string;
  postcode: string;
  qc_courier: number;
  rank: string;
  rate: number;
  rating: number;
  realtime_tracking: string;
  region: number;
  rto_charges: number;
  rto_performance: number;
  seconds_left_for_pickup: number;
  secure_shipment_disabled: boolean;
  ship_type: number;
  state: string;
  suppress_date: string;
  suppress_text: string;
  suppression_dates: ISuppressionDates | null;
  surface_max_weight: string;
  tracking_performance: number;
  volumetric_max_weight: number | null;
  weight_cases: number;
  zone: string;
}

export interface IBlockedCourierCompany {
  block_reason: string;
  courier_company_id: number;
  courier_name: string;
  postcode: string;
}

export interface IRecommendedBy {
  id: number;
  title: string;
}

export interface IShipRocketServiceabilityData {
  available_courier_companies: IAvailableCourierCompany[];
  blocked_courier_companies: IBlockedCourierCompany[];
  child_courier_id: number | null;
  is_recommendation_enabled: number;
  recommendation_advance_rule: number;
  recommended_by: IRecommendedBy;
  recommended_courier_company_id: number;
  shiprocket_recommended_courier_id: number;
}

export interface IShipRocketServiceabilityResponse {
  company_auto_shipment_insurance_setting: boolean;
  covid_zones: ICovidZones;
  currency: string;
  data: IShipRocketServiceabilityData;
  dg_courier: number;
  eligible_for_insurance: boolean;
  insurace_opted_at_order_creation: boolean;
  is_allow_templatized_pricing: boolean;
  is_latlong: number;
  is_old_zone_opted: boolean;
  is_zone_from_mongo: boolean;
  label_generate_type: number;
  on_new_zone: number;
  seller_address: any[];
  status: number;
  user_insurance_manadatory: boolean;
}

/**
 * Shipment booking response from courier provider
 * status can be boolean (false = failed) or string (e.g. 'BOOKED', 'FAILED')
 */
export interface IShipmentBookingResponse {
  providerShipmentId: string;
  trackingNumber: string;
  trackingUrl?: string;
  labelUrl?: string;
  awbNumber?: string;
  status: string | boolean;
  message?: string;
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
  createShipment(
    payload: any,
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
