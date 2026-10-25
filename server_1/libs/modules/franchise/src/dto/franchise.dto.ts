import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  BusinessTypeEnum,
  IManageFranchise,
  InputLengthEnum,
  INVOICE_NUMBER_FORMAT_MAX_LENGTH,
  InternationalTaxModeEnum,
} from '@eatfit247-shared-lib';
import { CreateAddressDto, MediaUploadDto } from '@server_1/core';

export class CreateFranchiseDto implements IManageFranchise {
  @IsNotEmpty()
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_10)
  franchiseCode!: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  financialYear!: number;

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
  addressObj?: CreateAddressDto;

  /** Checked against the template by InvoiceNumberFormatUtil in the service (decision 6) */
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_10)
  invoicePrefix?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(INVOICE_NUMBER_FORMAT_MAX_LENGTH)
  invoiceNumberFormat?: string | null;

  /** GST registration threshold in INR (turnover warning, decision 12) */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  registrationThresholdAmount?: number | null;
  /** Working currency, ISO 4217 (configurable tax treatment, decision 17); defaults to the address country's */
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() || null : value))
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be an ISO 4217 code' })
  currencyCode?: string | null;
}

