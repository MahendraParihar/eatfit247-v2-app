import { IAdminInfo } from '../../base.interface';

export interface IBaseWarehouse {
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

export interface IManageWarehouse extends IBaseWarehouse {
  warehouseId?: number;
}

export interface IWarehouse extends IBaseWarehouse, IAdminInfo {
  warehouseId: number;
  state?: { stateId: number; state: string; code: string };
  country?: { countryId: number; country: string; countryCode: string };
}

export interface IBaseCourierProviderWarehouse {
  warehouseId: number;
  providerId: number;
  providerWarehouseId?: string;
  providerWarehouseName?: string;
  rawResponse?: Record<string, unknown>;
  active: boolean;
}

export interface IManageCourierProviderWarehouse extends IBaseCourierProviderWarehouse {
  courierProviderWarehouseId?: number;
}

export interface ICourierProviderWarehouse extends IBaseCourierProviderWarehouse, IAdminInfo {
  courierProviderWarehouseId: number;
  updatedAt: Date;
  warehouse?: { warehouseId: number; name: string };
  provider?: { providerId: number; providerCode: string; providerName: string };
}
