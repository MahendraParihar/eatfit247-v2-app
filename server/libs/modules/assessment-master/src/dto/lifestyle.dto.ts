import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageLifestyle } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateLifestyleDto implements IManageLifestyle {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  lifestyle: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsOptional()
  @IsNumber()
  lifestyleId?: number;
}

