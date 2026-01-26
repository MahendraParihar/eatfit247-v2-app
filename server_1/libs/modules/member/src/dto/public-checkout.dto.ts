import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  IMemberProductOrderItemBasic,
  InputLengthEnum,
  PaymentSourceEnum,
} from '@eatfit247-shared-lib';

export class CreatePublicCheckoutPaymentLinkDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsNotEmpty()
  @IsString()
  currency!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  franchisePaymentGatewayId?: number;

  @IsOptional()
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };

  @IsOptional()
  notes?: Record<string, any>;
}

export class CreatePublicCheckoutOrderDto {
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

  @IsNotEmpty()
  @IsNumber()
  paymentStatusId!: number;

  @IsNotEmpty()
  @IsNumber()
  taxPercentage!: number;

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

  @IsOptional()
  paymentGatewayResponse?: Record<string, any>;

  @IsArray()
  orderItems!: IMemberProductOrderItemBasic[];
}

export class CreatePublicCheckoutPlanOrderDto {
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

  @IsNotEmpty()
  @IsNumber()
  paymentStatusId!: number;

  @IsOptional()
  @IsNumber()
  programId!: number;

  @IsNotEmpty()
  @IsNumber()
  programPlanId!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  noOfCycle!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  noOfDaysInCycle!: number;

  @IsNotEmpty()
  @IsBoolean()
  isTaxApplicable!: boolean;

  @IsNotEmpty()
  @IsNumber()
  taxPercentage!: number;

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

  @IsOptional()
  paymentGatewayResponse?: Record<string, any>;
}

