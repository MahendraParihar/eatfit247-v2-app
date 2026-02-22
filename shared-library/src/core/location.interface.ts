import { IAdminInfo, IBaseAdminUser, IDropdownItem } from '../base.interface';
import { TaxTypeEnum } from '../enum';

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

export interface ICountry extends IBaseCountry, IAdminInfo {
  countryId: number;
  active: boolean;
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

export interface IState extends IBaseState, IAdminInfo {
  stateId: number;
  country?: string; // Country name from relationship
  active: boolean;
}

export interface IAddressBasic {
  addressName?: string;
  postalAddress: string;
  cityVillage?: string;
  countryId: number;
  stateId: number;
  pinCode?: string;
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
  state: string;
  country: string;
  countryCode?: string;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface IAddressMaster {
  state: IDropdownItem[];
  country: IDropdownItem[];
}

export interface IMemberAddress extends IAddressBasic {
  addressId: number;
  state: string;
  stateCode?: string;
  country: string;
  countryCode?: string;
}