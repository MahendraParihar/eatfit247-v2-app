export interface INimbusShipmentPayload{
    courier_id: number;
    request_auto_pickup?: string,
    order_number: string;
    shipping_charges?: number;
    discount?:  number;
    cod_charges:  number;
    payment_type: string;
    order_amount:  number;
    package_weight:  number;
    package_length?:  number;
    package_breadth?:  number;
    package_height?:  number;
    consignee: {
        name: string;
        address: string;
        address_2: string;
        city: string;
        state: string;
        pincode: number;
        phone: string;
    },
    pickup: {
        warehouse_name: string;
        name : string;
        address: string;
        address_2: string;
        city: string;
        state: string;
        pincode: number;
        phone: string;
    },
    order_items?: {
        name: string;
        qty: string;
        price: string;
        sku: string;
    }[];
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

export interface INimbusShipmentResponse {

    status: boolean,
    message: string,
    data: {
        order_id: number;
        shipment_id: number;
        awb_number: string;
        courier_id: string;
        courier_name: string;
        status: string;
        additional_info: string;
        payment_type:  'cod' | 'prepaid';
        label: string
    }
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