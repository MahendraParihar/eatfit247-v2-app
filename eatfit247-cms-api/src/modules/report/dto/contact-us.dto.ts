import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { InputLength } from '../../../constants/input-length';
import { Type } from 'class-transformer';
import { DEFAULT_CONTACT_NUMBER_COUNTRY_CODE } from '../../../constants/config-constants';

export class CreateContactUsDto {
  @MaxLength(InputLength.CHAR_100)
  @IsNotEmpty()
  name: string;

  @MaxLength(InputLength.MAX_EMAIL)
  @IsEmail()
  @IsNotEmpty()
  @Type(() => IsEmail)
  emailId: string;

  @MaxLength(InputLength.MAX_COUNTRY_CODE)
  @IsNotEmpty()
  countryCode?: string = DEFAULT_CONTACT_NUMBER_COUNTRY_CODE;

  @MaxLength(InputLength.MAX_CONTACT_NUMBER)
  @IsNotEmpty()
  contactNumber: string;

  @IsNotEmpty()
  @MaxLength(InputLength.CHAR_1000)
  message: string;

  @IsNotEmpty()
  @MaxLength(InputLength.CHAR_1000)
  respondedMessage: string;

  @IsNotEmpty()
  active: boolean;
}

export class SendResponseDto {
  @IsNotEmpty()
  @MaxLength(InputLength.CHAR_1000)
  respondedMessage: string;
}
