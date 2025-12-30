import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IManageMemberPayment, InputLengthEnum, IManageAddress } from 'eatfit247-shared-lib';

export class CreateMemberPaymentDto implements IManageMemberPayment {
  @IsNotEmpty()
  @IsNumber()
  memberId: number;

  @IsNotEmpty()
  @IsNumber()
  paymentModeId: number;

  @IsNotEmpty()
  @IsNumber()
  programPlanId: number;

  @IsNotEmpty()
  @IsNumber()
  programId: number;

  @IsOptional()
  @IsNumber()
  addressId?: number;

  @IsOptional()
  @IsNumber()
  billingAddressId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_250)
  transactionId?: string;

  @IsNotEmpty()
  @IsDateString()
  paymentDate: Date;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_100)
  invoiceId?: string;

  @IsNotEmpty()
  @IsNumber()
  paymentStatusId: number;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_100)
  promoCode?: string;

  @IsNotEmpty()
  @IsBoolean()
  isTaxApplicable: boolean;

  @IsNotEmpty()
  @IsObject()
  paymentObj: object;

  @IsOptional()
  @IsObject()
  refundObj?: object;

  @IsOptional()
  @IsObject()
  paymentGatewayResponse?: object;

  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_50)
  gstNumber?: string;

  @IsOptional()
  @IsNumber()
  memberPaymentId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  address?: IManageAddress;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  billingAddress?: IManageAddress;
}

