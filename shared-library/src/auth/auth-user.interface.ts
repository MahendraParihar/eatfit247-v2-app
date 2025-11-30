export interface ILogin {
  emailId: string;
  password: string;
}

export interface IAuthUser {
  adminUserId: number;
  adminId?: number; // Alias for compatibility
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
  newPassword: string;
}

