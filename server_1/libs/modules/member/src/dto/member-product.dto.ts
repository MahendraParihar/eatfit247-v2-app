import {
  IsArray,
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
  IManageMemberProduct,
  IMemberProductOrderItemBasic,
  InputLengthEnum,
  PaymentSourceEnum,
} from '@eatfit247-shared-lib';

export class CreateMemberProductDto implements IManageMemberProduct {
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
  @IsArray()
  orderItems: IMemberProductOrderItemBasic[];
}

