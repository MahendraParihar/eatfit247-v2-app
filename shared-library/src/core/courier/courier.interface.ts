export interface ICourierProviderCredentials{
    providerAccountId: number;
    apiBaseUrl: string;
    apiKey: string;
    apiSecret: string;
    username: string;
    password: string;
    authToken: string;
    tokenExpiry: Date;
    authType: string;
}

export interface IResolvedProviderWarehousePair {
    warehouseId: number;
    warehousePincode: string;
    providerId: number;
    providerCode: string;
    providerName: string;
    priorityOrder: number;
    providerAccountId: number;
    providerWarehouseId: string | undefined;
    providerWarehouseName: string | undefined;
    credentials: ICourierProviderCredentials;
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

export interface ITrackingEvent {
    status: string;
    description: string;
    eventTime: Date;
    location?: string;
    metadata?: Record<string, unknown>;
    trackingEventId: number;
    providerStatus: string;
    internalStatus: string;
}

export interface ITrackingInfo {
    trackingNumber: string;
    trackingUrl?: string;
    currentStatus: string;
    providerName?: string;
    estimatedDeliveryDate?: Date;
    trackingEvents: ITrackingEvent[];
}

export interface IRateQuote {
    rateQuoteId?: number;
    providerId: number;
    providerName?: string;
    serviceId?: number;
    serviceCode: string;
    serviceName: string;
    rateAmount: number;
    currency: string;
    estimatedDays?: number;
    estimatedDeliveryDate?: Date;
    metadata?: Record<string, unknown>;
}

export interface IRateQuoteWithPriority extends IRateQuote {
    priorityOrder: number;
}