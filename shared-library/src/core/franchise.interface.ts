import { IBaseAdminUser } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';
import { IManageAddress } from './location.interface';

export interface IBaseFranchise {
  companyName: string;
  logo?: IMediaUpload[];
  firstName: string;
  lastName: string;
  emailId: string;
  alternateEmailId: string;
  contactNumber: string;
  alternateContactNumber: string;
  panNumber: string;
  tanNumber: string;
  gstNumber: string;
  vatNumber?: string;
  bankAccountId?: string;
  paymentGatewayConfigId?: number;
  brandName?: string;
  lutNumber?: string;
  internationalTaxMode?: string;
  startDate: Date;
  endDate?: Date;
  isPrimary: boolean;
  isDefault: boolean;
  businessType?: ('service' | 'product')[];
  addressObj?: IManageAddress;
}

export interface IManageFranchise extends IBaseFranchise {
  franchiseId?: number;
  active: boolean;
}

export interface IFranchise extends IBaseFranchise {
  franchiseId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

