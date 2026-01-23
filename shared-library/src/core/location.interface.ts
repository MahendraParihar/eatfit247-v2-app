import { IBaseAdminUser, IDropdownItem } from "../base.interface";
import { TaxTypeEnum } from "../enum/tax-type.enum";

export interface IBaseCountry {
  country: string;
  countryCode: string;
  phoneNumberCode?: string;
  taxType?: TaxTypeEnum | string;
  defaultTaxPercentage?: number;
}

export interface IManageCountry extends IBaseCountry {
  countryId?: number;
  active: boolean;
}

export interface ICountry extends IBaseCountry {
  countryId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface IBaseState {
  state: string;
  code: string;
  countryId: number;
  taxPercentage?: number;
}

export interface IManageState extends IBaseState {
  stateId?: number;
  active: boolean;
}

export interface IState extends IBaseState {
  stateId: number;
  country?: string; // Country name from relationship
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface IAddressBasic {
  addressName?: string;
  postalAddress: string;
  cityVillage?: string;
  countryId: number;
  stateId: number;
  pinCode?: string;
  addressTypeId: number;
  latitude?: number;
  longitude?: number;
}

export interface IManageAddress extends IAddressBasic {
  addressId?: number;
  tableId?: number;
  pkOfTable?: number;
}

export interface IAddress extends IManageAddress {
  addressId: number;
  addressType: string;
  state: string;
  country: string;
  countryCode?: string;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface IAddressMaster {
  state: IDropdownItem[];
  country: IDropdownItem[];
  addressType: IDropdownItem[];
}