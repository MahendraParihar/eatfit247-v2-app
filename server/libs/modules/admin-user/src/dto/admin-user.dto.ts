import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional, IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageAdminUser } from 'eatfit247-shared-lib';
import { MediaUploadDto, CreateAddressDto } from '@server/common';

export class CreateAdminUserDto implements IManageAdminUser {
  @MinLength(InputLengthEnum.MIN_NAME)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  firstName: string;
  @MinLength(InputLengthEnum.MIN_NAME)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  lastName: string;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  profilePicture?: MediaUploadDto[];
  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_5)
  countryCode: string;
  @IsNotEmpty()
  @MinLength(InputLengthEnum.MIN_CONTACT_NUMBER)
  @MaxLength(InputLengthEnum.MAX_CONTACT_NUMBER)
  contactNumber: string;
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(InputLengthEnum.MAX_EMAIL)
  emailId: string;
  @IsOptional()
  @IsNumber()
  addressId?: number;
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
  @IsOptional()
  @IsNumber()
  franchiseId?: number;
  @IsNotEmpty()
  @IsBoolean()
  active: boolean;
  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_1000)
  deactivationReason?: string;
  @IsOptional()
  password?: string;
  @IsOptional()
  @IsNumber({}, { each: true })
  roleIds?: number[];
  @IsOptional()
  @IsNumber()
  adminId?: number;
  @IsOptional()
  @IsString()
  verificationCode?: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;
}

