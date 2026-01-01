import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { MediaUploadDto, SeoDto } from '@server_1/core';
import { IManageBlog } from '@eatfit247-shared-lib';

export class CreateBlogDto implements IManageBlog {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  title!: string;
  @MinLength(InputLengthEnum.CHAR_2)
  @IsNotEmpty()
  description!: string;
  @IsNotEmpty()
  @IsNumber()
  blogCategoryId!: number;
  @IsNotEmpty()
  @IsNumber()
  blogAuthorId!: number;
  @IsBoolean()
  isPublished!: boolean;
  @IsBoolean()
  isCommentAllow!: boolean;
  @IsBoolean()
  isMailSentToSubscriber!: boolean;
  @IsDate()
  @Type(() => Date)
  writtenAt!: Date;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];
  @IsNotEmpty()
  active!: boolean;
  @IsOptional()
  @IsNumber()
  blogId?: number;
  @ValidateNested()
  @Type(() => SeoDto)
  seo!: SeoDto;
}
