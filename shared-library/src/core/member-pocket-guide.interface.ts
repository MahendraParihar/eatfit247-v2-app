import { IAdminInfo } from '../base.interface';

export interface IBaseMemberPocketGuide {
  memberId: number;
  pocketGuideId: number;
}

export interface IManageMemberPocketGuide extends IBaseMemberPocketGuide {
  memberPocketGuideId?: number;
}

export interface IMemberPocketGuide extends IManageMemberPocketGuide, IAdminInfo {
  pocketGuideId: number;
  pocketGuide: string;
  isSelected: boolean;
}
