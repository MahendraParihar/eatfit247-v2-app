import {IAvailableCourierCompany, IBlockedCourierCompany, ICovidZones, IRecommendedBy} from "./courier.interface";

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
    metadata?: Record<string, unknown>;
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