import { ICreatePaymentLinkRequest } from '@eatfit247-shared-lib';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePaymentLinkDto implements ICreatePaymentLinkRequest {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsNotEmpty()
  @IsString()
  currency!: string;

  @IsNotEmpty()
  @IsNumber()
  franchisePaymentGatewayId!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  notes?: Record<string, any>;
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  gatewayCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  paymentId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  orderId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(512)
  signature?: string;
}

