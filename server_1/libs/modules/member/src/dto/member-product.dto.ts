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
  @IsNotEmpty()
  @IsNumber()
  paymentModeId: number;
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
  paymentDate!: Date;
  @IsNotEmpty()
  @IsNumber()
  paymentStatusId!: number;
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
