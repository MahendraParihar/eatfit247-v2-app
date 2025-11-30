import { IsString, MinLength } from 'class-validator';
import { IResetPasswordRequest } from 'eatfit247-shared-lib';

export class ResetPasswordDto implements IResetPasswordRequest {
  @IsString()
  token: string;
  @IsString()
  @MinLength(8)
  newPassword: string;
}

