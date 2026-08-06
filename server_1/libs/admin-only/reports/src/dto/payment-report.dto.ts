import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { OptionalReportSortDto } from '@server_1/core';
import {
  FinancialQuarter,
  IPaymentReportFilter,
  PaymentReportCountryMode,
  PaymentReportCountrySource,
  TaxMode,
  TaxTypeEnum,
} from '@eatfit247-shared-lib';

/** Keeps "All payments" (no selection) distinct from an explicit `false`. */
const toOptionalBoolean = ({ value }: { value: unknown }): boolean | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  return value === true || value === 'true' || value === 1 || value === '1';
};

export class PaymentReportDto extends OptionalReportSortDto implements IPaymentReportFilter {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number;

  /** Capped so a crafted request cannot recreate the old unbounded query. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  fyStartYear?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([1, 2, 3, 4])
  fyQuarter?: FinancialQuarter;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  franchiseId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' && value.trim() ? value.trim() : undefined))
  memberSearch?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(300)
  @Type(() => Number)
  @IsInt({ each: true })
  countryIds?: number[];

  @IsOptional()
  @IsIn(['in', 'notIn'])
  countryMode?: PaymentReportCountryMode;

  @IsOptional()
  @IsIn(['member', 'billing'])
  countrySource?: PaymentReportCountrySource;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minTotalAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxTotalAmount?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsEnum(TaxTypeEnum, { each: true })
  taxTypes?: TaxTypeEnum[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsEnum(TaxMode, { each: true })
  taxModes?: TaxMode[];

  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isTaxApplicable?: boolean;
}
