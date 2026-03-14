export interface ILogin {
  emailId: string;
  password: string;
}

export interface IAuthUser {
  adminId: number;
  firstName?: string;
  lastName?: string;
  emailId: string;
  profilePicture?: object;
  countryCode?: string;
  contactNumber?: string;
}

export interface IChangePassword {
  password: string;
  newPassword: string;
  repeatPassword: string;
}

export interface IToken {
  accessToken: string;
  refreshToken: string;
}

export interface IAdminUserLogin extends IToken {
  admin: IAuthUser;
}

export interface IForgotPasswordRequest {
  emailId: string;
}

export interface IResetPasswordRequest {
  token: string;
  emailId: string;
  newPassword: string;
}

