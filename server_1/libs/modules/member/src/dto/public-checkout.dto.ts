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
  ICreatePaymentLinkRequest, IManageMemberPayment,
  IManageMemberProduct,
  IMemberProductOrderItemBasic,
  InputLengthEnum,
  PaymentSourceEnum,
} from '@eatfit247-shared-lib';

export class CreatePublicCheckoutPaymentLinkDto implements ICreatePaymentLinkRequest {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;
  @IsNotEmpty()
  @IsString()
  currency: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsNotEmpty()
  @IsNumber()
  franchisePaymentGatewayId: number;
  @IsOptional()
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  @IsOptional()
  notes?: Record<string, any>;
}

export class CreatePublicCheckoutOrderDto implements IManageMemberProduct {
  @IsOptional()
  @IsNumber()
  paymentModeId?: number;
  @IsOptional()
  @IsNumber()
  billingAddressId: number;
  @IsOptional()
  @IsNumber()
  addressId?: number;
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_250)
  transactionId?: string;
  @IsNotEmpty()
  @IsDateString()
  paymentDate: Date;
  @IsNotEmpty()
  @IsNumber()
  paymentStatusId: number;
  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_10)
  currency: string;
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
  paymentSource: PaymentSourceEnum;
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountAmount: number;
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
  orderItems: IMemberProductOrderItemBasic[];
}

export class CreatePublicCheckoutPlanOrderDto implements IManageMemberPayment {
  @IsOptional()
  @IsNumber()
  memberPaymentId?: number;
  @IsNotEmpty()
  @IsNumber()
  memberId: number;
  @IsNotEmpty()
  @IsString()
  currency: string;
  @IsOptional()
  @IsNumber()
  paymentModeId?: number;
  @IsNotEmpty()
  @IsNumber()
  billingAddressId: number;
  @IsOptional()
  @IsNumber()
  addressId?: number;
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_250)
  transactionId?: string;
  @IsNotEmpty()
  @IsDateString()
  paymentDate: Date;
  @IsNotEmpty()
  @IsNumber()
  paymentStatusId: number;
  @IsOptional()
  @IsNumber()
  programId?: number;
  @IsNotEmpty()
  @IsNumber()
  programPlanId: number;
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
  paymentSource: PaymentSourceEnum;
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount: number;
  @IsOptional()
  @IsString()
  gatewayProvider: string;
  @IsOptional()
  @IsString()
  gatewayOrderId: string;
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_100)
  gatewayPaymentId: string;
  @IsOptional()
  paymentGatewayResponse?: Record<string, any>;
}
