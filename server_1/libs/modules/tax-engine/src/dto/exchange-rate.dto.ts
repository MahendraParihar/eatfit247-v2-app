import { IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Length, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { IManageExchangeRate } from '@eatfit247-shared-lib';

export class ManageExchangeRateDto implements IManageExchangeRate {
  @IsDateString({ strict: true })
  rateDate!: string;

  @IsNotEmpty()
  @Length(3, 3)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  fromCurrency!: string;

  @IsNotEmpty()
  @Length(3, 3)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  toCurrency!: string;

  @IsNumber({ maxDecimalPlaces: 8 })
  @IsPositive()
  rate!: number;

  @IsIn(['MANUAL', 'CBIC_CUSTOMS'])
  source!: 'MANUAL' | 'CBIC_CUSTOMS';

  @IsOptional()
  @IsDateString({ strict: true })
  validTo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string | null;
}
