import { IsDateString, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  assignedAdminId: number;

  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  appointmentType: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  contactFormId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  memberId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  guestName?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  guestEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(25)
  guestPhone?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
