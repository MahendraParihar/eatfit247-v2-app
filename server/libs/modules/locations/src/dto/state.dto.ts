import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength } from 'class-validator';
import { InputLengthEnum, IManageState } from '@eatfit247-shared-lib';

export class CreateStateDto implements IManageState {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  state: string;

  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_10)
  @IsNotEmpty()
  code: string;

  @IsNotEmpty()
  @IsNumber()
  countryId: number;

  @IsOptional()
  @IsNumber()
  taxPercentage?: number;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsOptional()
  @IsNumber()
  stateId?: number;
}

