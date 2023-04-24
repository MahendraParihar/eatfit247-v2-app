import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { InputLength } from '../../../constants/input-length';

export class AuthAdminUserIdDTO {
  @IsNotEmpty()
  emailId: string;
}

export class AuthAdminUserDTO extends AuthAdminUserIdDTO {
  @IsNotEmpty()
  password: string;
}

export class AuthAdminUserResetPasswordDTO extends AuthAdminUserDTO {
  @IsNotEmpty()
  repeatPassword: string;

  @MaxLength(6)
  @MinLength(6)
  readonly otp: string;
}

export class AdminUserDTO extends AuthAdminUserDTO {
  @IsNotEmpty()
  @MaxLength(InputLength.MAX_NAME)
  @MinLength(InputLength.MIN_NAME)
  readonly firstName: string;

  @IsNotEmpty()
  @MaxLength(InputLength.MAX_NAME)
  @MinLength(InputLength.MIN_NAME)
  readonly lastName: string;

  @IsNotEmpty()
  @MaxLength(InputLength.MAX_CONTACT_NUMBER)
  readonly contactNo: string;

  @IsNotEmpty()
  readonly startDate: Date;

  verificationCode: string;

  @MaxLength(50)
  createdIp: string;

  @MaxLength(50)
  modifiedIp: string;

  @IsNotEmpty()
  createdBy: number;

  @IsNotEmpty()
  modifiedBy: number;

  @IsNotEmpty()
  roleId: number;

  @IsNotEmpty()
  @MaxLength(100)
  address: string;

  @IsNotEmpty()
  @MaxLength(InputLength.PIN_CODE)
  pinCode: string;

  @IsNotEmpty()
  cityVillageId: number;

  addressTypeId: number;

  latitude?: number;
  longitude?: number;
}
