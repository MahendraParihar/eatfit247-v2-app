import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageCallPurpose } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateCallPurposeDto implements IManageCallPurpose {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  callPurpose: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsOptional()
  @IsNumber()
  callPurposeId?: number;
}

