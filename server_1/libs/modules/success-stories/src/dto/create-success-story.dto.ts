import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IManageSuccessStory, InputLengthEnum, SuccessStoryMediaType } from '@eatfit247-shared-lib';
import { MediaUploadDto } from '@server_1/core';

export class CreateSuccessStoryDto implements IManageSuccessStory {
  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_250)
  name!: string;
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_250)
  title?: string;
  @IsNotEmpty()
  @IsDateString()
  date!: Date;
  @IsNotEmpty()
  @IsString()
  description!: string;
  @IsNotEmpty()
  @IsEnum(['image', 'video', 'youtube'] as const)
  mediaType!: SuccessStoryMediaType;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_500)
  youtubeUrl?: string;
  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;
  @IsOptional()
  @IsNumber()
  successStoryId?: number;
}
