import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageReferrer } from 'eatfit247-shared-lib';
import { CreateAddressDto, MediaUploadDto } from '@server/common';

export class CreateReferrerDto implements IManageReferrer {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  name: string;
  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_100)
  companyName?: string;
  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_100)
  websiteLink?: string;
  @IsNotEmpty()
  @IsNumber()
  franchiseId: number;
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(InputLengthEnum.CHAR_50)
  emailId: string;
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(InputLengthEnum.CHAR_100)
  alternateEmailId: string;
  @IsNotEmpty()
  @MaxLength(InputLengthEnum.MAX_CONTACT_NUMBER)
  contactNumber: string;
  @IsNotEmpty()
  @MaxLength(InputLengthEnum.MAX_CONTACT_NUMBER)
  alternateContactNumber: string;
  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_20)
  panNumber?: string;
  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_20)
  tanNumber?: string;
  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_50)
  gstNumber?: string;
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
  @IsNotEmpty()
  @IsBoolean()
  active: boolean;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  logo?: MediaUploadDto[];
  @IsOptional()
  @IsNumber()
  referrerId?: number;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;
}

