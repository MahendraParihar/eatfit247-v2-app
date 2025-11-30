import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';
import { IManageAdminRolePermission } from 'eatfit247-shared-lib';

export class CreateAdminRolePermissionDto implements IManageAdminRolePermission {
  @IsNotEmpty()
  @IsNumber()
  roleId: number;

  @IsNotEmpty()
  @IsNumber()
  adminId: number;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  adminRolePermissionId?: number;
}

