import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageMember } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateMemberDto implements IManageMember {
  @MinLength(InputLengthEnum.MIN_NAME)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  firstName: string;
  @MinLength(InputLengthEnum.MIN_NAME)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  lastName: string;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  profilePicture?: MediaUploadDto[];
  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_5)
  countryCode: string;
  @IsNotEmpty()
  @MinLength(InputLengthEnum.MIN_CONTACT_NUMBER)
  @MaxLength(InputLengthEnum.MAX_CONTACT_NUMBER)
  contactNumber: string;
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(InputLengthEnum.MAX_EMAIL)
  emailId: string;
  @IsNotEmpty()
  @IsNumber()
  franchiseId: number;
  @IsNotEmpty()
  @IsNumber()
  countryId: number;
  @IsOptional()
  @IsNumber()
  referrerId?: number;
  @IsOptional()
  @IsNumber()
  nutritionistId?: number;
  @IsNotEmpty()
  @IsBoolean()
  active: boolean;
  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_1000)
  deactivationReason?: string;
  @IsOptional()
  @IsBoolean()
  hasAnyPlan?: boolean;
  @IsOptional()
  password?: string;

  @IsOptional()
  @IsNumber()
  memberId?: number;
}

