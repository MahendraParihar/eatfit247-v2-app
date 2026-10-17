import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  InputLengthEnum,
  IPublicPlanOrderRequest,
  IPublicPlanTaxCalculationRequest,
  IPublicProductOrderItem,
  IPublicProductOrderRequest,
  IPublicProductTaxCalculationRequest,
  IPublicVerifyPaymentRequest,
} from '@eatfit247-shared-lib';

/*
 * Public checkout DTOs carry only what the customer chooses. Money state (status,
 * source, date, amounts, discount, transaction/gateway ids, gateway response) is not
 * a field here, so the global ValidationPipe (whitelist + forbidNonWhitelisted)
 * rejects any request that sends it with 400.
 */

const CURRENCY_PATTERN = /^[A-Za-z]{3}$/;

export class PublicProductOrderItemDto implements IPublicProductOrderItem {
  @IsInt()
  @Min(1)
  productId!: number;

  @IsInt()
  @Min(1)
  productVariantId!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity!: number;
}

export class PublicPlanOrderDto implements IPublicPlanOrderRequest {
  @IsInt()
  @Min(1)
  programPlanId!: number;

  @IsString()
  @Matches(CURRENCY_PATTERN, { message: 'currency must be an ISO-4217 code' })
  currency!: string;

  @IsInt()
  @Min(1)
  addressId!: number;

  @IsInt()
  @Min(1)
  billingAddressId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_50)
  gstNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_50)
  promoCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  franchisePaymentGatewayId?: number;
}

export class PublicProductOrderDto implements IPublicProductOrderRequest {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PublicProductOrderItemDto)
  items!: PublicProductOrderItemDto[];

  @IsString()
  @Matches(CURRENCY_PATTERN, { message: 'currency must be an ISO-4217 code' })
  currency!: string;

  @IsInt()
  @Min(1)
  addressId!: number;

  @IsInt()
  @Min(1)
  billingAddressId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_50)
  gstNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_50)
  promoCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  franchisePaymentGatewayId?: number;
}

export class PublicPlanTaxCalculationDto implements IPublicPlanTaxCalculationRequest {
  @IsInt()
  @Min(1)
  programPlanId!: number;

  @IsString()
  @Matches(CURRENCY_PATTERN, { message: 'currency must be an ISO-4217 code' })
  currency!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  addressId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  billingAddressId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_50)
  promoCode?: string;
}

export class PublicProductTaxCalculationDto implements IPublicProductTaxCalculationRequest {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PublicProductOrderItemDto)
  items!: PublicProductOrderItemDto[];

  @IsString()
  @Matches(CURRENCY_PATTERN, { message: 'currency must be an ISO-4217 code' })
  currency!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  addressId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  billingAddressId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_50)
  promoCode?: string;
}

export class PublicVerifyPaymentDto implements IPublicVerifyPaymentRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_100)
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_100)
  paymentId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_200)
  signature!: string;
}
