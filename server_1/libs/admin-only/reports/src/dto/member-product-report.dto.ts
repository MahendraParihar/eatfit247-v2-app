import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ShipmentStatusEnum } from '@eatfit247-shared-lib';

/**
 * DTO for member product order report filtering
 */
export class MemberProductReportDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  franchiseId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  paymentStatusId?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasShipment?: boolean;

  @IsOptional()
  @IsEnum(ShipmentStatusEnum)
  shipmentStatus?: ShipmentStatusEnum;
}

