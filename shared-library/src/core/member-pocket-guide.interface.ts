import { IBaseAdminUser } from '../base.interface';
import { IPocketGuide } from './pocket-guide.interface';

export interface IBaseMemberPocketGuide {
  memberId: number;
  pocketGuideId: number;
}

export interface IManageMemberPocketGuide extends IBaseMemberPocketGuide {
  memberPocketGuideId?: number;
}

export interface IMemberPocketGuide extends IBaseMemberPocketGuide {
  memberPocketGuideId: number;
  pocketGuide?: string;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}
