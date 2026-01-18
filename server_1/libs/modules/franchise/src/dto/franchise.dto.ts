import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IManageFranchise, InputLengthEnum, InternationalTaxModeEnum, BusinessTypeEnum } from '@eatfit247-shared-lib';
import { MediaUploadDto, CreateAddressDto } from '@server_1/core';

export class CreateFranchiseDto implements IManageFranchise {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  companyName!: string;

  @IsNotEmpty()
  @MinLength(InputLengthEnum.MIN_NAME)
  @MaxLength(InputLengthEnum.CHAR_50)
  firstName!: string;

  @IsNotEmpty()
  @MinLength(InputLengthEnum.MIN_NAME)
  @MaxLength(InputLengthEnum.CHAR_50)
  lastName!: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(InputLengthEnum.MAX_EMAIL)
  emailId!: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(InputLengthEnum.MAX_EMAIL)
  alternateEmailId!: string;

  @IsNotEmpty()
  @MaxLength(InputLengthEnum.MAX_CONTACT_NUMBER)
  contactNumber!: string;

  @IsNotEmpty()
  @MaxLength(InputLengthEnum.MAX_CONTACT_NUMBER)
  alternateContactNumber!: string;

  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_20)
  panNumber!: string;

  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_20)
  tanNumber!: string;

  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_50)
  gstNumber!: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_100)
  vatNumber?: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_100)
  bankAccountId?: string;

  @IsOptional()
  @IsNumber()
  paymentGatewayConfigId?: number;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_100)
  brandName?: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_100)
  lutNumber?: string;

  @IsOptional()
  @IsEnum(InternationalTaxModeEnum)
  internationalTaxMode?: InternationalTaxModeEnum;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsNotEmpty()
  @IsBoolean()
  isPrimary!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isDefault!: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(BusinessTypeEnum, { each: true })
  businessType?: BusinessTypeEnum[];

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  logo?: MediaUploadDto[];

  @IsOptional()
  @IsNumber()
  franchiseId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;
}

