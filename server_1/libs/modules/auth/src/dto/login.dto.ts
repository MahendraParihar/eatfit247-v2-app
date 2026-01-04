import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { ILogin, InputLengthEnum } from '@eatfit247-shared-lib';

export class LoginDto implements ILogin {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(InputLengthEnum.MAX_EMAIL)
  emailId!: string;

  @IsNotEmpty()
  password!: string;
}

