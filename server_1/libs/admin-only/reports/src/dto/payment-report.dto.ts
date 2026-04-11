import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OptionalReportSortDto } from '@server_1/core';

export class PaymentReportDto extends OptionalReportSortDto {
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @IsNotEmpty()
  @IsString()
  endDate: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  franchiseId?: number;
}

