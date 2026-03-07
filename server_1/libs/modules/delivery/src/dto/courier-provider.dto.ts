import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength } from 'class-validator';
import { IManageCourierProvider, InputLengthEnum } from '@eatfit247-shared-lib';

export class CreateCourierProviderDto implements IManageCourierProvider {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(30)
  @IsNotEmpty()
  providerCode!: string;

  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(100)
  @IsNotEmpty()
  providerName!: string;

  @IsNotEmpty()
  @IsEnum(['API_KEY', 'JWT', 'BASIC'])
  authType!: 'API_KEY' | 'JWT' | 'BASIC';

  @IsNotEmpty()
  @IsBoolean()
  supportsRateApi!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  supportsWebhook!: boolean;

  @IsNotEmpty()
  @IsNumber()
  priorityOrder!: number;

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @IsNumber()
  providerId?: number;
}

