import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional, IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { InputLengthEnum, IManageBlogAuthor } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';
import { Type } from 'class-transformer';

export class CreateBlogAuthorDto implements IManageBlogAuthor {
  @MinLength(InputLengthEnum.MIN_NAME)
  @MaxLength(InputLengthEnum.MAX_NAME)
  @IsNotEmpty()
  firstName: string;

  @MinLength(InputLengthEnum.MIN_NAME)
  @MaxLength(InputLengthEnum.MAX_NAME)
  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(InputLengthEnum.MAX_EMAIL)
  emailId: string;

  @IsNotEmpty()
  @MaxLength(InputLengthEnum.MAX_COUNTRY_CODE)
  countryCode: string;

  @IsNotEmpty()
  @MinLength(InputLengthEnum.MIN_CONTACT_NUMBER)
  @MaxLength(InputLengthEnum.MAX_CONTACT_NUMBER)
  contactNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_100)
  linkedUrl?: string;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  profilePicture?: MediaUploadDto[];

  @IsOptional()
  @IsNumber()
  blogAuthorId?: number;
}

