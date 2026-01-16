import { IsNotEmpty, IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentReportDto {
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

