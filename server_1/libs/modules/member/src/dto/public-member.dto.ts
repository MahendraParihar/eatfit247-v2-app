import { IsEmail, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength } from 'class-validator';
import { InputLengthEnum } from '@eatfit247-shared-lib';

export class CreatePublicMemberDto {
  @MinLength(InputLengthEnum.MIN_NAME)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  firstName!: string;

  @MinLength(InputLengthEnum.MIN_NAME)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  lastName!: string;

  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_5)
  countryCode!: string;

  @IsNotEmpty()
  @MinLength(InputLengthEnum.MIN_CONTACT_NUMBER)
  @MaxLength(InputLengthEnum.MAX_CONTACT_NUMBER)
  contactNumber!: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(InputLengthEnum.MAX_EMAIL)
  emailId!: string;

  @IsNotEmpty()
  @IsNumber()
  countryId!: number;

  @IsOptional()
  @IsNumber()
  referrerId?: number;

  @IsOptional()
  @IsNumber()
  nutritionistId?: number;

  @IsOptional()
  recaptchaToken?: string;
}

