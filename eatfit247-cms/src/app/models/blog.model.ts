import {AdminShortInfoModel} from "./admin-short-info.model";
import {MediaUploadResponseModel} from "./media-upload-response.model";
import {BaseModel} from "./base.model";

export class BlogModel extends BaseModel {
  title: string;
  blogCategoryId: number;
  blogCategory?: string;
  blogAuthorId: number;
  blogAuthor?: string;
  description: string;
  isPublished: boolean;
  isCommentAllow: boolean;
  isMailSentToSubscriber: boolean;
  writtenAt: string;
  visitedCount: number;
  shareCount: number;
  tags: string[];
  url: string[];

  static override fromJson(data: any): BlogModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: BlogModel = new BlogModel();
    authUserObj.id = data.id;
    authUserObj.title = data.title;
    authUserObj.blogCategoryId = data.blogCategoryId;
    authUserObj.blogCategory = data.blogCategory;
    authUserObj.blogAuthorId = data.blogAuthorId;
    authUserObj.blogAuthor = data.blogAuthor;
    authUserObj.description = data.description;
    authUserObj.isPublished = data.isPublished;
    authUserObj.isCommentAllow = data.isCommentAllow;
    authUserObj.isMailSentToSubscriber = data.isMailSentToSubscriber;
    authUserObj.visitedCount = data.visitedCount;
    authUserObj.shareCount = data.shareCount;
    authUserObj.writtenAt = data.writtenAt;
    authUserObj.tags = data.tags;
    authUserObj.url = data.url;
    authUserObj.active = data.active;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}
