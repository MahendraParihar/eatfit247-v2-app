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
import { InputLengthEnum, IManageBanner, BannerForEnum } from '@eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateBannerDto implements IManageBanner {
  @IsNotEmpty()
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsString()
  title: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_200)
  @IsString()
  subTitle?: string;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath: MediaUploadDto[];

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isInternalUrl: boolean;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_200)
  @IsString()
  url?: string;

  @IsNotEmpty()
  @IsEnum(BannerForEnum)
  bannerFor: BannerForEnum;

  @IsOptional()
  @IsNumber()
  bannerId?: number;
}
