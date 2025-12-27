import { IBaseAdminUser } from "../base.interface";

export interface IBaseMemberPocketGuide {
  memberId: number;
  pocketGuideId: number;
}

export interface IManageMemberPocketGuide extends IBaseMemberPocketGuide {
  memberPocketGuideId?: number;
}

export interface IMemberPocketGuide extends IManageMemberPocketGuide {
  pocketGuideId: number;
  pocketGuide: string;
  isSelected: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}
