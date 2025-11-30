import { IMediaUpload } from "./media-upload.interface";
import { ICreateUpdate } from "./common.interface";

export interface IBlog extends ICreateUpdate {
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
}

export interface IManageBlog {
  title: string;
  description: string;
  blogCategoryId: number;
  blogAuthorId: number;
  isPublished: boolean;
  isCommentAllow: boolean;
  isMailSentToSubscriber: boolean;
  writtenAt: Date;
  tags: string[];
  uploadFiles?: IMediaUpload[];
  active: boolean;
}