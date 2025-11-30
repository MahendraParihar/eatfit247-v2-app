/**
 * User Related Interfaces
 * Shared across all EatFit247 applications
 */
export interface IAuthUser {
  adminUserId: number;
  firstName: string;
  lastName: string;
  emailId: string;
  profilePicture: object;
  countryCode: string;
  contactNumber: string;
}

export interface IAdminUser extends IAuthUser {
  roleId?: number;
  roleName?: string;
  franchiseId?: number;
  permissions?: string[];
}

export interface IToken {
  accessToken: string;
  refreshToken: string;
}

export interface IAdminUserLogin extends IToken {
  admin: IAdminUser;
}

export interface IUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMember extends IUser {
  memberCode?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  targetWeight?: number;
  nutritionistId?: number;
  programId?: number;
}

export interface ILoginRequest {
  emailId: string;
  password: string;
}

export interface ILoginResponse {
  token: string;
  refreshToken: string;
  user: IAdminUser | IMember;
  expiresIn?: string;
}

