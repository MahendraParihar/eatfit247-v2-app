import { IBaseAdminUser, IAdminInfo } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';
import { IManageAddress } from './location.interface';
import { BusinessTypeEnum } from '../enum';

export interface IBaseFranchise {
  franchiseCode: string;
  financialYear: number;
  companyName: string;
  logo?: IMediaUpload[];
  firstName: string;
  lastName: string;
  emailId: string;
  alternateEmailId: string;
  contactNumber: string;
  alternateContactNumber: string;
  panNumber?: string;
  tanNumber?: string;
  gstNumber?: string;
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
  businessType?: BusinessTypeEnum[];
  addressObj?: IManageAddress;
}

export interface IManageFranchise extends IBaseFranchise {
  franchiseId?: number;
  active: boolean;
}

export interface IFranchise extends IBaseFranchise, IAdminInfo {
  franchiseId: number;
  active: boolean;
}

