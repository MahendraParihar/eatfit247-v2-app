import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ContactFormReportDto {
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @IsNotEmpty()
  @IsString()
  endDate: string;

  @IsOptional()
  @IsString()
  search?: string;
}

