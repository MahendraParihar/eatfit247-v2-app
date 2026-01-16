import { ICreatePaymentLinkRequest } from '@eatfit247-shared-lib';
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

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

