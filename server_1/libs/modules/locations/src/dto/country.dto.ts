import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IManageCountry, InputLengthEnum } from '@eatfit247-shared-lib';

export class CreateCountryDto implements IManageCountry {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  country!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_5)
  countryCode: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_5)
  phoneNumberCode?: string;

  @IsOptional()
  taxType?: string;

  @IsOptional()
  @IsNumber()
  defaultTaxPercentage?: number;

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @IsNumber()
  countryId?: number;
}

