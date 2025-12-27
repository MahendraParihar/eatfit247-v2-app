import { IBaseAdminUser } from '../base.interface';

export interface IBaseAddressType {
  addressType: string;
}

export interface IManageAddressType extends IBaseAddressType {
  addressTypeId?: number;
  active: boolean;
}

export interface IAddressType extends IBaseAddressType {
  addressTypeId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}
