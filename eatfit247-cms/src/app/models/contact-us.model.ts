import {AdminShortInfoModel} from "./admin-short-info.model";

export class ContactUsModel {
  id: any;
  name: string;
  emailId: string;
  message: string;
  countryCode: string;
  contactNumber: string;
  respondedBy?: AdminShortInfoModel;
  respondedMessage?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;

  static fromJson(data: any): ContactUsModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: ContactUsModel = new ContactUsModel();
    authUserObj.id = data.id;
    authUserObj.name = data.name;
    authUserObj.emailId = data.emailId;
    authUserObj.message = data.message;
    authUserObj.countryCode = data.countryCode;
    authUserObj.contactNumber = data.contactNumber;
    authUserObj.respondedMessage = data.respondedMessage;
    authUserObj.active = data.active;
    authUserObj.respondedBy = AdminShortInfoModel.fromJson(data.respondedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}
