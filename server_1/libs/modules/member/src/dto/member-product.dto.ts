import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IBasicMemberProduct, IOrderItem, InputLengthEnum, PaymentSourceEnum } from '@eatfit247-shared-lib';

export class OrderItemDto implements IOrderItem {
  @IsNotEmpty()
  @IsString()
  productId!: number;

  @IsNotEmpty()
  @IsString()
  productUnit!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  productQuantity!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  perQuantityAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  orderQuantity!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount!: number;
}

export class CreateMemberProductDto implements IBasicMemberProduct {
  @IsOptional()
  @IsNumber()
  memberProductId?: number;

  @IsNotEmpty()
  @IsNumber()
  memberId!: number;

  @IsOptional()
  @IsNumber()
  paymentModeId?: number | null;

  @IsOptional()
  @IsNumber()
  billingAddressId?: number | null;

  @IsOptional()
  @IsNumber()
  addressId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_250)
  transactionId?: string;

  @IsNotEmpty()
  @IsDateString()
  paymentDate!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_100)
  invoiceId?: string;

  @IsNotEmpty()
  @IsNumber()
  paymentStatusId!: number;

  @IsNotEmpty()
  @IsBoolean()
  isTaxApplicable!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isPlanFeesIncludedTax!: boolean;

  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_10)
  currencyCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_100)
  promoCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_50)
  gstNumber?: string;

  @IsNotEmpty()
  @IsEnum(PaymentSourceEnum)
  paymentSource!: PaymentSourceEnum;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  orderAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  taxAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountAmount!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsOptional()
  @IsString()
  paymentLink?: string;

  @IsOptional()
  @IsString()
  gatewayProvider?: string;

  @IsOptional()
  @IsString()
  gatewayOrderId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_100)
  gatewayPaymentId?: string;

  // Product-specific fields
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNotEmpty()
  @IsString()
  size!: string; // Product size selected

  // Payment object will be calculated and stored
  @IsNotEmpty()
  @IsObject()
  paymentObj!: object;

  @IsOptional()
  @IsObject()
  refundObj?: object | null;

  @IsOptional()
  @IsObject()
  paymentGatewayResponse?: object | null;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  products!: OrderItemDto[];
}

