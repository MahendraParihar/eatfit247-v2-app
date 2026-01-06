import { IBaseAdminUser } from "../base.interface";
import { IMediaUpload } from "./media-upload.interface";
import { BannerForEnum } from "../enum/banner-for.enum";

export interface IBaseBanner {
  title: string;
  subTitle?: string;
  imagePath: IMediaUpload[];
  bannerFor: BannerForEnum;
  imagePosition?: string;
  titleIcon?: string;
  description?: string;
  primaryActionText?: string;
  primaryActionUrl?: string;
  secondaryActionText?: string;
  secondaryActionUrl?: string;
  isInternalUrl?: boolean;
}

export interface IManageBanner extends IBaseBanner {
  bannerId?: number;
  active: boolean;
}

export interface IBanner extends IBaseBanner {
  bannerId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}
