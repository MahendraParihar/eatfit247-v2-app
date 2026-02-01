import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ICalculateTaxResponse,
  InputLengthEnum,
  TaxMode,
  TaxTypeEnum,
} from '@eatfit247-shared-lib';
import { Type } from 'class-transformer';

export class CalculateTaxResponseJurisdictionDto {
  @IsNotEmpty()
  @IsString()
  entityCountry!: string;

  @IsNotEmpty()
  @IsString()
  customerCountry!: string;

  @IsNotEmpty()
  @IsString()
  placeOfSupply!: string;
}

export class CalculateTaxResponseDto implements ICalculateTaxResponse {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  taxPercentage!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  orderAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  taxableAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  taxAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsNotEmpty()
  @IsObject()
  taxObj!: Record<string, { amount: number; taxPercentage: number }>;

  @IsNotEmpty()
  @IsEnum(TaxTypeEnum)
  taxType!: TaxTypeEnum;

  @IsNotEmpty()
  @IsEnum(TaxMode)
  taxMode!: TaxMode;

  @IsOptional()
  @IsString()
  invoiceNote?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_10)
  currency!: string;

  @IsNotEmpty()
  @IsBoolean()
  isLutApplied!: boolean;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CalculateTaxResponseJurisdictionDto)
  jurisdiction!: CalculateTaxResponseJurisdictionDto;
}
