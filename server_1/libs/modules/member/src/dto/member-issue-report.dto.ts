import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OptionalReportSortDto } from '@server_1/core';

export class MemberIssueReportDto extends OptionalReportSortDto {
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @IsNotEmpty()
  @IsString()
  endDate: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  issueStatusId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  issueCategoryId?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isOpen?: boolean;
}

