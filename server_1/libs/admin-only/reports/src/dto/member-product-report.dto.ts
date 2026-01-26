import { IsDateString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

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
}

