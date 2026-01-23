import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaxTypeEnum, TransactionType } from '@eatfit247-shared-lib';

export class CreateTaxMasterDto {
  @IsNotEmpty()
  @IsNumber()
  franchiseId: number;

  @IsOptional()
  @IsNumber()
  referenceId?: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(3)
  countryCode!: string;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  transactionType!: TransactionType;

  @IsNotEmpty()
  @IsEnum(TaxTypeEnum)
  taxSystem!: TaxTypeEnum;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  taxCode!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  taxName!: string;

  @IsNotEmpty()
  @IsNumber()
  taxPercent!: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  applyOn!: string;

  @IsNotEmpty()
  @IsBoolean()
  isTaxInclusive!: boolean;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  effectiveFrom!: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveTo?: Date | null;
}

