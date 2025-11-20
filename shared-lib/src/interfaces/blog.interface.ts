import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';

export interface IBlog {
  id: any;
  title: string;
  blogCategoryId: number;
  blogCategory?: string;
  blogAuthorId: number;
  blogAuthor?: string;
  description: string;
  isPublished: boolean;
  isCommentAllow: boolean;
  isMailSentToSubscriber: boolean;
  writtenAt: string | Date;
  visitedCount: number;
  shareCount: number;
  tags: string[];
  url: string;
  active: boolean;
  imagePath: IMediaUpload[];
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
}
