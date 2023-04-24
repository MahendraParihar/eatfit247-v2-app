import { IsBoolean, IsDate, IsNotEmpty, IsNumber, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLength } from '../../../constants/input-length';
import { MediaUploadDto } from '../../../common-dto/media-upload.dto';

export class CreateBlogDto {
  @MinLength(InputLength.CHAR_2)
  @MaxLength(InputLength.CHAR_100)
  @IsNotEmpty()
  title: string;

  @MinLength(InputLength.CHAR_2)
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

  @IsNotEmpty()
  tags: string[];

  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  @IsNotEmpty()
  active: boolean;
}
