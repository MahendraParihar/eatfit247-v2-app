import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IManagePermissionMatrix, IPermissionGrant } from '@eatfit247-shared-lib';

export class PermissionGrantDto implements IPermissionGrant {
  @IsNotEmpty()
  @IsNumber()
  subjectId!: number;

  @IsNotEmpty()
  @IsNumber()
  actionId!: number;
}

export class UpdatePermissionMatrixDto implements IManagePermissionMatrix {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionGrantDto)
  grants!: PermissionGrantDto[];
}
