import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { IForgotPasswordRequest, InputLengthEnum } from '@eatfit247-shared-lib';

export class ForgotPasswordDto implements IForgotPasswordRequest {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(InputLengthEnum.MAX_EMAIL)
  emailId!: string;
}

