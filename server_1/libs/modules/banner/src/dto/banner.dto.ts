import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BannerForEnum, IManageBanner, InputLengthEnum } from '@eatfit247-shared-lib';
import { MediaUploadDto } from '@server_1/core';

export class CreateBannerDto implements IManageBanner {
  @IsNotEmpty()
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsString()
  title!: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_200)
  @IsString()
  subTitle?: string;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath!: MediaUploadDto[];

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  @IsNotEmpty()
  @IsEnum(BannerForEnum)
  bannerFor!: BannerForEnum;

  @IsOptional()
  @MaxLength(10)
  @IsString()
  imagePosition?: string;

  @IsOptional()
  @MaxLength(20)
  @IsString()
  titleIcon?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @MaxLength(50)
  @IsString()
  primaryActionText?: string;

  @IsOptional()
  @MaxLength(100)
  @IsString()
  primaryActionUrl?: string;

  @IsOptional()
  @MaxLength(50)
  @IsString()
  secondaryActionText?: string;

  @IsOptional()
  @MaxLength(100)
  @IsString()
  secondaryActionUrl?: string;

  @IsOptional()
  @IsBoolean()
  isInternalUrl?: boolean;

  @IsOptional()
  @IsNumber()
  bannerId?: number;
}
