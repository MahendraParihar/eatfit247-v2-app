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
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  IManageMemberPayment,
  InputLengthEnum,
  PaymentSourceEnum,
} from '@eatfit247-shared-lib';
import { CreateAddressDto } from '@server/common';

export class CreateMemberPaymentDto implements IManageMemberPayment {
  @IsOptional()
  @IsNumber()
  memberPaymentId?: number;

  @IsNotEmpty()
  @IsNumber()
  memberId: number;

  @IsNotEmpty()
  @IsNumber()
  paymentModeId: number;

  @IsNotEmpty()
  @IsNumber()
  programId: number;

  @IsNotEmpty()
  @IsNumber()
  programPlanId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  noOfCycle: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  noOfDaysInCycle: number;

  @IsOptional()
  @IsNumber()
  billingAddressId?: number;

  @IsOptional()
  @IsNumber()
  addressId?: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  billingAddress: CreateAddressDto;

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
  @IsBoolean()
  isTaxApplicable: boolean;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  taxPercentage: number;

  @IsNotEmpty()
  @IsBoolean()
  isPlanFeesIncludedTax: boolean;

  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_10)
  currencyCode: string;

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
  orderAmount: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  taxAmount: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountAmount: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount: number;
}

