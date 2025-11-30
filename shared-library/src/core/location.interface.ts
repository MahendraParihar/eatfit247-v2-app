import { IBaseAdminUser } from '../base.interface';

export interface IBaseCountry {
  country: string;
  countryCode?: string;
  phoneNumberCode?: string;
}

export interface IManageCountry extends IBaseCountry {
  countryId?: number;
  active: boolean;
}

export interface ICountry extends IBaseCountry {
  countryId: number;
  id?: number; // For compatibility with old interface
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
}

export interface IManageState extends IBaseState {
  stateId?: number;
  active: boolean;
}

export interface IState extends IBaseState {
  stateId: number;
  id?: number; // For compatibility with old interface
  country?: string; // Country name from relationship
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

