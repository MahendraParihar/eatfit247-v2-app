import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressBasicDto } from '../../../common-dto/address.dto';

export class CreateMemberPaymentDto {
  @IsNotEmpty()
  @Type(() => Date)
  paymentDate: Date;

  @IsNumber()
  @IsNotEmpty()
  @Max(65)
  @Min(1)
  noOfCycle: number;

  @IsNumber()
  @IsNotEmpty()
  @Max(364)
  @Min(1)
  daysInCycle: number;

  @IsBoolean()
  @IsNotEmpty()
  isTaxApplicable: boolean;

  @IsNumber()
  @IsNotEmpty()
  memberId: number;

  @IsNumber()
  @IsNotEmpty()
  paymentModeId: number;

  @IsNumber()
  @IsNotEmpty()
  programId: number;

  @IsNumber()
  @IsNotEmpty()
  planId: number;

  @IsNumber()
  @IsNotEmpty()
  paymentStatusId: number;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsNumber()
  @IsNotEmpty()
  systemDiscountAmount: number;

  @IsString()
  @IsNotEmpty()
  userCurrency: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => AddressBasicDto)
  address?: AddressBasicDto;
}
