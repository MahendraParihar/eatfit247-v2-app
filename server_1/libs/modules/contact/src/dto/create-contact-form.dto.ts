import { IsEmail, IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';
import { InputLengthEnum } from '@eatfit247-shared-lib';

export class CreateContactFormDto {
  @MinLength(InputLengthEnum.MIN_NAME)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(InputLengthEnum.MAX_EMAIL)
  email!: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.MAX_CONTACT_NUMBER)
  phone?: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_200)
  subject?: string;

  @IsOptional()
  @MaxLength(1000)
  message?: string;

  @IsOptional()
  recaptchaToken?: string;
}

