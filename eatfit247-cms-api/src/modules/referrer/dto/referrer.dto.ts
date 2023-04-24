import { IsDate, IsEmail, IsNotEmpty, IsNumber, MaxLength, ValidateNested } from 'class-validator';
import { InputLength } from '../../../constants/input-length';
import { Type } from 'class-transformer';
import { MediaUploadDto } from '../../../common-dto/media-upload.dto';
import { AddressBasicDto } from '../../../common-dto/address.dto';

export class CreateReferrerDto {
  @MaxLength(InputLength.CHAR_100)
  @IsNotEmpty()
  name: string;

  @MaxLength(InputLength.CHAR_100)
  companyName?: string;

  @MaxLength(InputLength.CHAR_100)
  websiteLink?: string;

  @IsNumber()
  franchiseId?: string;

  @MaxLength(InputLength.MAX_CONTACT_NUMBER)
  contactNumber?: string;

  @MaxLength(InputLength.MAX_CONTACT_NUMBER)
  alternateContactNumber?: string;

  @MaxLength(InputLength.MAX_EMAIL)
  @IsEmail()
  @Type(() => IsEmail)
  emailId?: string;

  @MaxLength(InputLength.MAX_EMAIL)
  @IsEmail()
  @Type(() => IsEmail)
  alternateEmailId?: string;

  @MaxLength(20)
  panNumber?: string;

  @MaxLength(20)
  tanNumber?: string;

  @MaxLength(InputLength.CHAR_50)
  gstNumber?: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  @IsNotEmpty()
  active: boolean;

  @IsNotEmpty()
  @Type(() => AddressBasicDto)
  address?: AddressBasicDto;
}
