import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { IManageBlogCategory, InputLengthEnum } from '@eatfit247-shared-lib';
import { MediaUploadDto } from '@server_1/core';
import { Type } from 'class-transformer';

export class CreateBlogCategoryDto implements IManageBlogCategory {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  blogCategory!: string;
  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_250)
  url?: string;
  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];
  @IsOptional()
  @IsNumber()
  blogCategoryId?: number;
}

