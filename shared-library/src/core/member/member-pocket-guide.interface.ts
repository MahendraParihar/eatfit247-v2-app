import {IAdminInfo} from "../../base.interface";


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
  /** True when the guide has a PDF (shows the Download action). */
  hasFile: boolean;
  /** Friendly name to save the download as, e.g. "Detox Diet.pdf". */
  downloadFileName?: string;
}
