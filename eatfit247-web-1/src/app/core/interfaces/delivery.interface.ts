export interface CourierProvider {
  courierProviderId: number;
  providerCode: string;
  providerName: string;
  authType: 'API_KEY' | 'JWT' | 'BASIC';
  supportsRateApi: boolean;
  supportsWebhook: boolean;
  priorityOrder: number;
  active: boolean;
}

export interface ManageCourierProvider extends Omit<CourierProvider, 'courierProviderId'> {
  courierProviderId?: number;
}

export interface Warehouse {
  warehouseId: number;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateId: number;
  countryId: number;
  pinCode: string;
  latitude?: number;
  longitude?: number;
  active: boolean;
}

export interface ManageWarehouse extends Omit<Warehouse, 'warehouseId'> {
  warehouseId?: number;
}

export interface CourierProviderWarehouse {
  courierProviderWarehouseId: number;
  warehouseId: number;
  courierProviderId: number;
  providerWarehouseId?: string;
  providerWarehouseName?: string;
  rawResponse?: Record<string, unknown>;
  active: boolean;
}

export interface ManageCourierProviderWarehouse
  extends Omit<CourierProviderWarehouse, 'courierProviderWarehouseId'> {
  courierProviderWarehouseId?: number;
}
