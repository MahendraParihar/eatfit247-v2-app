import { IAdminInfo, ICommonSEO, ICommonTable } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBaseBlog {
  title: string;
  description: string;
  blogCategoryId: number;
  blogAuthorId: number;
  isPublished: boolean;
  isCommentAllow: boolean;
  isMailSentToSubscriber: boolean;
  writtenAt: Date;
  imagePath?: IMediaUpload[];
  seo: ICommonSEO;
}

export interface IManageBlog extends IBaseBlog {
  blogId?: number;
}

export interface IBlog extends IBaseBlog, ICommonTable, IAdminInfo {
  blogId: number;
  blogCategory: string;
  blogAuthor: string;
  visitedCount: number;
  shareCount: number;
  url: string;
  active: boolean;
}

// Blog Category Interfaces
export interface IBaseBlogCategory {
  blogCategory: string;
  url: string;
  imagePath?: IMediaUpload[];
}

export interface IManageBlogCategory {
  blogCategory: string;
  url?: string; // Optional because it can be auto-generated from blogCategory
  imagePath?: IMediaUpload[];
  blogCategoryId?: number;
  active: boolean;
}

export interface IBlogCategory extends IBaseBlogCategory, IAdminInfo {
  blogCategoryId: number;
  id?: number; // For compatibility with old interface
  active: boolean;
}

// Blog Author Interfaces
export interface IBaseBlogAuthor {
  firstName: string;
  lastName: string;
  emailId: string;
  countryCode: string;
  contactNumber: string;
  linkedUrl?: string;
  profilePicture?: IMediaUpload[];
}

export interface IManageBlogAuthor extends IBaseBlogAuthor {
  blogAuthorId?: number;
  active: boolean;
}

export interface IBlogAuthor extends IBaseBlogAuthor, IAdminInfo {
  blogAuthorId: number;
  active: boolean;
}

// Blog Comment Interfaces
export interface IBaseBlogComment {
  comment: string;
  blogId: number;
  memberId?: number;
  adminId?: number;
  parentCommentId?: number;
}

export interface IManageBlogComment extends IBaseBlogComment {
  blogCommentId?: number;
  active: boolean;
}

export interface IBlogComment extends IBaseBlogComment, IAdminInfo {
  blogCommentId: number;
  active: boolean;
  member?: {
    memberId: number;
    firstName?: string;
    lastName?: string;
  };
}

