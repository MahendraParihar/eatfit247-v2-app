import { IAdminInfo, ICommonTable } from '../base.interface';
import { GoogleReviewEntityTypeEnum, GoogleReviewSourceEnum } from '../enum/google-review.enum';

export interface IBaseGoogleReview {
  entityType: GoogleReviewEntityTypeEnum;
  entityId: number;
  source: GoogleReviewSourceEnum;
  googleReviewIdExt?: string | null;
  reviewerName: string;
  reviewerRole?: string | null;
  reviewerPhotoUrl?: string | null;
  rating: number;
  reviewText?: string | null;
  reviewDate: Date;
  language: string;
  isPublished: boolean;
  displayOrder: number;
}

export interface IManageGoogleReview extends IBaseGoogleReview {
  googleReviewId?: number;
  active: boolean;
}

export interface IGoogleReviewReply {
  adminReply: string;
}

export interface IGoogleReview extends IBaseGoogleReview, ICommonTable, IAdminInfo {
  googleReviewId: number;
  adminReply?: string | null;
  adminRepliedAt?: Date | null;
  adminRepliedBy?: number | null;
  helpfulCount: number;
  entityName?: string | null;
}

export interface IPublicGoogleReview {
  googleReviewId: number;
  entityType: GoogleReviewEntityTypeEnum;
  entityId: number;
  reviewerName: string;
  reviewerRole?: string | null;
  reviewerPhotoUrl?: string | null;
  rating: number;
  reviewText?: string | null;
  reviewDate: Date;
  language: string;
  adminReply?: string | null;
  adminRepliedAt?: Date | null;
  helpfulCount: number;
  displayOrder: number;
}

export interface IGoogleReviewSearch {
  entityType?: GoogleReviewEntityTypeEnum;
  entityId?: number;
  rating?: number;
  source?: GoogleReviewSourceEnum;
  isPublished?: boolean;
}
