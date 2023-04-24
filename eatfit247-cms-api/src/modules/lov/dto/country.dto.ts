import { IsNotEmpty, MaxLength } from 'class-validator';
import { InputLength } from '../../../constants/input-length';

export class CreateCountryDto {
  @MaxLength(InputLength.CHAR_100)
  @IsNotEmpty()
  name: string;

  @MaxLength(InputLength.CHAR_5)
  countryCode: string;

  @MaxLength(InputLength.CHAR_5)
  phoneNumberCode: string;

  @IsNotEmpty()
  active: boolean;
}
