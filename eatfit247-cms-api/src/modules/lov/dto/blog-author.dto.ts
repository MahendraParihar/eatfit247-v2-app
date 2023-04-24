import { IsEmail, IsNotEmpty, IsUrl, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLength } from '../../../constants/input-length';
import { MediaUploadDto } from '../../../common-dto/media-upload.dto';

export class CreateBlogAuthorDto {
  @MinLength(InputLength.CHAR_5)
  @MaxLength(InputLength.CHAR_50)
  @IsNotEmpty()
  firstName: number;

  @MinLength(InputLength.CHAR_5)
  @MaxLength(InputLength.CHAR_50)
  @IsNotEmpty()
  lastName: number;

  @MaxLength(InputLength.CHAR_5)
  @IsNotEmpty()
  countryCode: string;

  @MaxLength(InputLength.MAX_CONTACT_NUMBER)
  @IsNotEmpty()
  contactNumber: string;

  @MaxLength(InputLength.MAX_EMAIL)
  @IsNotEmpty()
  @IsEmail()
  emailId: string;

  @MaxLength(InputLength.CHAR_100)
  @IsNotEmpty()
  @IsUrl()
  linkedUrl: string;

  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  @IsNotEmpty()
  active: boolean;
}
