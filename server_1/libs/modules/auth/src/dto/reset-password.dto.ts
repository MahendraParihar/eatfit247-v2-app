import { IsEmail, IsString, MinLength } from 'class-validator';
import { IResetPasswordRequest } from '@eatfit247-shared-lib';

export class ResetPasswordDto implements IResetPasswordRequest {
  @IsString()
  token!: string;

  /**
   * The user's email address — taken from the `uid` query param in the
   * reset link.  Used to scope the token lookup to a single user, preventing
   * a full-table scan across all unused tokens.
   */
  @IsEmail()
  emailId!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
