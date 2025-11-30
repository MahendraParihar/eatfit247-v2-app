import { IDropdownItem } from "./common.interface";

export interface IAddressBasic {
  postalAddress: string;
  addressId: number;
  cityVillage: string;
  countryId: number;
  stateId?: number;
  pinCode: string;
  addressTypeId?: number;
  latitude?: number;
  longitude?: number;
}

export interface IManageAddress {
  tableId: number;
  pkOfTable: number;
}

export interface IAddress extends IAddressBasic {
  addressId: number;
  addressTypeId?: number;
  addressType?: string;
  state: string;
  country: string;
}

export interface IAddressMaster {
  state: IDropdownItem[];
  country: IDropdownItem[];
  addressType: IDropdownItem[];
}