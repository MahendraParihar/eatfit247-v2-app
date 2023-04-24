import {AdminShortInfoModel} from "./admin-short-info.model";
import {MediaUploadResponseModel} from "./media-upload-response.model";
import {BaseModel} from "./base.model";

export class FaqModel extends BaseModel {
  faq: string;
  faqCategoryId: number;
  faqCategory?: string;
  answer: string;

  static override fromJson(data: any): FaqModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: FaqModel = new FaqModel();
    authUserObj.id = data.id;
    authUserObj.faq = data.faq;
    authUserObj.faqCategoryId = data.faqCategoryId;
    authUserObj.faqCategory = data.faqCategory;
    authUserObj.answer = data.answer;
    authUserObj.active = data.active;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}
