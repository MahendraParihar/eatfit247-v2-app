export interface ILogin {
  emailId: string;
  password: string;
}

export interface IAuthUser {
  adminId: number;
  /** Same as adminId; kept for callers that use JWT-style naming. */
  adminUserId?: number;
  firstName?: string;
  lastName?: string;
  emailId: string;
  profilePicture?: object;
  countryCode?: string;
  contactNumber?: string;
  /** `mst_admin_roles.role_code` values for active role assignments. */
  roleKeys: string[];
  /**
   * Effective franchise scope: distinct union of `mst_admin_users.franchise_id`
   * and `txn_admin_franchises.franchise_id`. Empty for unscoped / global roles (e.g. Super Admin).
   */
  franchiseIds: number[];
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

