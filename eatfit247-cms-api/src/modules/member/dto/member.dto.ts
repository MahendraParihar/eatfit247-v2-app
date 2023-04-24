import { IsEmail, IsNotEmpty, IsNumber, IsOptional, MaxLength, ValidateNested } from 'class-validator';
import { InputLength } from '../../../constants/input-length';
import { Type } from 'class-transformer';
import { MediaUploadDto } from '../../../common-dto/media-upload.dto';

export class CreateMemberDto {
  @MaxLength(InputLength.CHAR_50)
  @IsNotEmpty()
  firstName: string;

  @MaxLength(InputLength.CHAR_50)
  @IsNotEmpty()
  lastName: string;

  @IsNumber()
  @IsNotEmpty()
  franchiseId: number;

  @IsNumber()
  @IsOptional()
  referrerId?: number;

  @IsNumber()
  @IsOptional()
  nutritionistId?: number;

  @IsNumber()
  countryId: number;

  @IsNotEmpty()
  contactNumber: string;

  @IsNotEmpty()
  @MaxLength(InputLength.MAX_COUNTRY_CODE)
  countryCode: string;

  @MaxLength(InputLength.MAX_EMAIL)
  @IsEmail()
  @Type(() => IsEmail)
  emailId?: string;

  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  @IsNotEmpty()
  @IsNumber()
  userStatusId: number;

  @MaxLength(InputLength.CHAR_1000)
  reason?: string;
}
