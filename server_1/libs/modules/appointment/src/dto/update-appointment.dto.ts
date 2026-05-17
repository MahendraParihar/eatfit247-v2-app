import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAppointmentDto {
  @IsDateString()
  @IsOptional()
  appointmentDate?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  status?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  cancellationReason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
