/**
 * User Status Enums
 * Shared across CMS and Web applications
 */
export enum UserStatusEnum {
  ACTIVE = 1,
  VERIFICATION_PENDING = -1,
  IN_ACTIVE = 0,
}

export enum AdminRoleEnum {
  SUPER_ADMIN = 1,
  ADMIN = 2,
  NUTRITIONIST = 3,
  FRANCHISE_OWNER = 4,
  SUPPORT = 5,
}

export enum AdminUserStatusEnum {
  ACTIVE = 1,
  INACTIVE = 0,
}

