import { IsBoolean, IsNotEmpty, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageMaritalStatus } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateMaritalStatusDto implements IManageMaritalStatus {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  maritalStatus: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  maritalStatusId?: number;
}

