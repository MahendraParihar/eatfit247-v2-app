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
  /** @deprecated Use `roles` array instead. Kept for backward compat during migration. */
  roleKeys: string[];
  /**
   * Effective franchise scope: distinct union of `mst_admin_users.franchise_id`
   * and `txn_admin_franchises.franchise_id`. Empty for unscoped / global roles (e.g. Super Admin).
   */
  franchiseIds: number[];
  /** Role assignments with display info for UI header/profile. */
  roles?: Array<{ roleId: number; role: string; roleCode: string }>;
  /** Effective permissions dictionary: { "Member": ["read","create","update","delete"], ... } */
  permissions?: Record<string, string[]>;
  /** Subject metadata for franchise scoping decisions in CASL. */
  subjectMeta?: Record<string, { franchiseScoped: boolean }>;
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

