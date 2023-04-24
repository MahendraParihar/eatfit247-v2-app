import { IsDate, IsEmail, IsNotEmpty, IsNumber, IsString, MaxLength, ValidateNested } from 'class-validator';
import { InputLength } from '../../../constants/input-length';
import { Type } from 'class-transformer';
import { MediaUploadDto } from '../../../common-dto/media-upload.dto';
import { AddressBasicDto } from '../../../common-dto/address.dto';

export class CreateAdminUserDto {
  @MaxLength(InputLength.CHAR_50)
  @IsNotEmpty()
  firstName: string;

  @MaxLength(InputLength.CHAR_50)
  @IsNotEmpty()
  lastName: string;

  @IsNumber()
  franchiseId?: number;

  @IsNotEmpty()
  contactNumber: string;

  @MaxLength(InputLength.MAX_COUNTRY_CODE)
  @IsNotEmpty()
  countryCode: string;

  @MaxLength(InputLength.MAX_EMAIL)
  @IsEmail()
  @Type(() => IsEmail)
  emailId?: string;

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
  @IsNumber()
  adminUserStatusId: number;

  @MaxLength(InputLength.CHAR_1000)
  reason?: string;

  @IsNotEmpty()
  @IsNumber()
  roleId: number;

  @IsNotEmpty()
  @Type(() => AddressBasicDto)
  address?: AddressBasicDto;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  repeatPassword: string;
}
