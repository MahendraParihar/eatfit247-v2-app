import { IAdminShortInfo } from './admin-user.interface';

export interface IContactUs {
  id: any;
  name: string;
  emailId: string;
  message: string;
  countryCode: string;
  contactNumber: string;
  respondedBy?: IAdminShortInfo;
  respondedMessage?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
