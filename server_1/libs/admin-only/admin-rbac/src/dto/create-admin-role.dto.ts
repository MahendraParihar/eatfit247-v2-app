import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IManageAdminRole } from '@eatfit247-shared-lib';

export class CreateAdminRoleDto implements IManageAdminRole {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  role!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  roleCode!: string;

  @IsOptional()
  @IsBoolean()
  grantAllOnNewSubject?: boolean;
}
