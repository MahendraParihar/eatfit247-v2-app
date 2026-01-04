import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
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
  @IsBoolean()
  isTaxApplicable!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isPlanFeesIncludedTax!: boolean;

  @IsNotEmpty()
  @IsString()
  currencyCode!: string;

  /**
   * Billing address ID (customer address)
   * Required when isTaxApplicable is true for accurate tax calculation
   * Tax rates depend on customer's location (country/state)
   */
  @IsOptional()
  @IsNumber()
  billingAddressId?: number;

  /**
   * Alternative address ID if billingAddressId is not provided
   * Required when isTaxApplicable is true for accurate tax calculation
   */
  @IsOptional()
  @IsNumber()
  addressId?: number;
}

