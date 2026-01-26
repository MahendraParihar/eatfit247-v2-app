import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ICalculateTaxRequest } from '@eatfit247-shared-lib';

export class CalculateTaxDto implements ICalculateTaxRequest {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  orderAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountAmount!: number;

  @IsNotEmpty()
  @IsString()
  currencyCode!: string;

  @IsOptional()
  @IsNumber()
  billingAddressId?: number;

  @IsOptional()
  @IsNumber()
  addressId?: number;
}

