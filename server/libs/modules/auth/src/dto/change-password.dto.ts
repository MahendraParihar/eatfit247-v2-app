import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { InputLengthEnum, IChangePassword } from '@eatfit247-shared-lib';

export class ChangePasswordDto implements IChangePassword {
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @MinLength(InputLengthEnum.MIN_PASSWORD)
  @MaxLength(InputLengthEnum.MAX_PASSWORD)
  newPassword: string;

  @IsNotEmpty()
  @MinLength(InputLengthEnum.MIN_PASSWORD)
  @MaxLength(InputLengthEnum.MAX_PASSWORD)
  repeatPassword: string;
}

