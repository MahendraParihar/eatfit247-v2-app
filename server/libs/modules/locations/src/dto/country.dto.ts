import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength } from 'class-validator';
import { InputLengthEnum, IManageCountry } from 'eatfit247-shared-lib';

export class CreateCountryDto implements IManageCountry {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  country: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_5)
  countryCode?: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_5)
  phoneNumberCode?: string;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsOptional()
  @IsNumber()
  countryId?: number;
}

