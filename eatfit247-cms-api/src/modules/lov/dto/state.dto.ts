import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { InputLength } from '../../../constants/input-length';

export class CreateStateDto {
  @MinLength(InputLength.CHAR_5)
  @MaxLength(InputLength.CHAR_100)
  @IsNotEmpty()
  name: string;

  @MaxLength(InputLength.CHAR_5)
  code: string;

  @IsNotEmpty()
  countryId: number;

  @IsNotEmpty()
  active: boolean;
}
