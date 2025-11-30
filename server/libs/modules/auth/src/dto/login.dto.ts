import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { InputLengthEnum, ILogin } from 'eatfit247-shared-lib';

export class LoginDto implements ILogin {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(InputLengthEnum.MAX_EMAIL)
  emailId: string;

  @IsNotEmpty()
  password: string;
}

