import { IsDateString, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { BasicSearchDto } from '@server_1/core';

export class AppointmentListDto extends BasicSearchDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  status?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  assignedAdminId?: number;

  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;
}
