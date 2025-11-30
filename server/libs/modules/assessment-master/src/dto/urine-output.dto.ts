import { IsBoolean, IsNotEmpty, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageUrineOutput } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateUrineOutputDto implements IManageUrineOutput {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  urineOutput: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  urineOutputId?: number;
  imagePath?: any;
}

