/**
 * User Status Enums
 * Shared across CMS and Web applications
 */
export var UserStatusEnum;
(function (UserStatusEnum) {
    UserStatusEnum[UserStatusEnum["ACTIVE"] = 1] = "ACTIVE";
    UserStatusEnum[UserStatusEnum["INACTIVE"] = 0] = "INACTIVE";
    UserStatusEnum[UserStatusEnum["DELETED"] = -1] = "DELETED";
    UserStatusEnum[UserStatusEnum["SUSPENDED"] = 2] = "SUSPENDED";
})(UserStatusEnum || (UserStatusEnum = {}));
export var AdminRoleEnum;
(function (AdminRoleEnum) {
    AdminRoleEnum[AdminRoleEnum["SUPER_ADMIN"] = 1] = "SUPER_ADMIN";
    AdminRoleEnum[AdminRoleEnum["ADMIN"] = 2] = "ADMIN";
    AdminRoleEnum[AdminRoleEnum["NUTRITIONIST"] = 3] = "NUTRITIONIST";
    AdminRoleEnum[AdminRoleEnum["FRANCHISE_OWNER"] = 4] = "FRANCHISE_OWNER";
    AdminRoleEnum[AdminRoleEnum["SUPPORT"] = 5] = "SUPPORT";
})(AdminRoleEnum || (AdminRoleEnum = {}));
export var AdminUserStatusEnum;
(function (AdminUserStatusEnum) {
    AdminUserStatusEnum[AdminUserStatusEnum["ACTIVE"] = 1] = "ACTIVE";
    AdminUserStatusEnum[AdminUserStatusEnum["INACTIVE"] = 0] = "INACTIVE";
})(AdminUserStatusEnum || (AdminUserStatusEnum = {}));
