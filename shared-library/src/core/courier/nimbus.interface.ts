export interface INimbusShipmentPayload{
    "order_number": string;
    "payment_type": string;
    "order_amount": number;
    "cod_amount": number,
    "package_weight": number,
    "package_length": number,
    "package_breadth": number,
    "package_height": number,
    "pickup_location": string;
    "billing_customer_name": string;
    "billing_last_name": string;
    "billing_address": string;
    "billing_city": string;
    "billing_pincode": string;
    "billing_state": string;
    "billing_country": string;
    "billing_email": string;
    "billing_phone": string;
    "shipping_is_billing": true;
    "order_items":{
        "name": string;
        "sku": string;
        "units": number,
        "selling_price": number,
        "discount": number,
        "tax": number,
        "hsn": string }[];
    "support_email": string;
    "support_phone": string;
}

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