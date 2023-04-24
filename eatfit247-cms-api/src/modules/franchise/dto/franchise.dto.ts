import { IsDate, IsEmail, IsNotEmpty, MaxLength, ValidateNested } from 'class-validator';
import { InputLength } from '../../../constants/input-length';
import { Type } from 'class-transformer';
import { MediaUploadDto } from '../../../common-dto/media-upload.dto';
import { AddressBasicDto } from '../../../common-dto/address.dto';

export class CreateFranchiseDto {
  @MaxLength(InputLength.CHAR_50)
  @IsNotEmpty()
  firstName: string;

  @MaxLength(InputLength.CHAR_50)
  @IsNotEmpty()
  lastName: string;

  @MaxLength(InputLength.CHAR_100)
  companyName?: string;

  @MaxLength(InputLength.MAX_CONTACT_NUMBER)
  contactNumber?: string;

  @MaxLength(InputLength.MAX_CONTACT_NUMBER)
  alternateContactNumber?: string;

  @MaxLength(InputLength.MAX_EMAIL)
  @IsEmail()
  emailId?: string;

  @MaxLength(InputLength.MAX_EMAIL)
  @IsEmail()
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
