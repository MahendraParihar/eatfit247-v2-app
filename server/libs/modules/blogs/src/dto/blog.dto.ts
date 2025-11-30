import { IsBoolean, IsDate, IsNotEmpty, IsNumber, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum } from 'eatfit247-shared-lib';
import { MediaUploadDto, SeoDto } from '@server/common';
import { IManageBlog } from 'eatfit247-shared-lib';

export class CreateBlogDto extends SeoDto implements IManageBlog {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  title: string;
  @MinLength(InputLengthEnum.CHAR_2)
  @IsNotEmpty()
  description: string;
  @IsNotEmpty()
  @IsNumber()
  blogCategoryId: number;
  @IsNotEmpty()
  @IsNumber()
  blogAuthorId: number;
  @IsBoolean()
  isPublished: boolean;
  @IsBoolean()
  isCommentAllow: boolean;
  @IsBoolean()
  isMailSentToSubscriber: boolean;
  @IsDate()
  @Type(() => Date)
  writtenAt: Date;
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];
  @IsNotEmpty()
  active: boolean;
}
