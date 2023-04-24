import {ApiUrlEnum} from "../enum/api-url-enum";

export class AuthUserModel {
  firstName?: string;
  roleId?: number;
  role?: string;
  lastName?: string;
  imagePath?: string;
  authToken?: string;

  static fromJson(data: any): AuthUserModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: AuthUserModel = new AuthUserModel();
    authUserObj.firstName = data.firstName;
    authUserObj.lastName = data.lastName;
    authUserObj.imagePath = data.imagePath ? ApiUrlEnum.BASE_IMAGE_URL + 'data.imagePath' : '';
    authUserObj.roleId = data.roleId;
    authUserObj.role = data.role;
    authUserObj.authToken = data.authToken;
    return authUserObj;
  }
}
