import {
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
import { IManageMemberPayment, InputLengthEnum, PaymentSourceEnum } from '@eatfit247-shared-lib';

export class CreateMemberPaymentDto implements IManageMemberPayment {
  @IsOptional()
  @IsNumber()
  memberPaymentId?: number;
  @IsNotEmpty()
  @IsNumber()
  memberId!: number;
  @IsOptional()
  @IsNumber()
  paymentModeId!: number;
  @IsNotEmpty()
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
  @IsOptional()
  @IsNumber()
  billingAddressId?: number;
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
  discountAmount!: number;
  @IsOptional()
  @IsString()
  paymentLink?: string;
  @IsOptional()
  @IsString()
  gatewayProvider?: string;
  @IsOptional()
  @IsString()
  gatewayOrderId?: string;
}

