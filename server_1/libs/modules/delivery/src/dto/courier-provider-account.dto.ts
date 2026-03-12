import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IManageCourierProviderAccount, InputLengthEnum } from '@eatfit247-shared-lib';

export class CreateCourierProviderAccountDto implements IManageCourierProviderAccount {
  @IsNotEmpty()
  @IsNumber()
  courierProviderId: number;

  @IsNotEmpty()
  @IsNumber()
  franchiseId: number;

  @IsOptional()
  @MaxLength(100)
  @IsString()
  accountName?: string;

  @IsNotEmpty()
  @IsString()
  apiBaseUrl: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  apiSecret?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string; // Will be encrypted before saving

  @IsOptional()
  @IsString()
  authToken?: string;

  @IsOptional()
  tokenExpiry?: Date;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsOptional()
  @IsNumber()
  providerAccountId?: number;
}

