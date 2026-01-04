import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateFranchisePaymentGatewayDto {
  @IsNotEmpty()
  @IsNumber()
  franchiseId!: number;
  @IsNotEmpty()
  @IsNumber()
  paymentGatewayId!: number;
  @IsNotEmpty()
  @IsString()
  countryCode!: string;
  @IsNotEmpty()
  @IsString()
  currencyCode!: string;
  @IsNotEmpty()
  @IsBoolean()
  isPrimary!: boolean;
  @IsNotEmpty()
  @IsBoolean()
  supportsDomestic!: boolean;
  @IsNotEmpty()
  @IsBoolean()
  supportsInternational!: boolean;
  @IsNotEmpty()
  @IsBoolean()
  supportsEmi!: boolean;
  @IsNotEmpty()
  @IsBoolean()
  supportsUpi!: boolean;
  @IsOptional()
  @IsNumber()
  @Min(0)
  settlementDelayDays?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  gatewayFeePercentage?: number;
  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;
}

export class UpdateFranchisePaymentGatewayDto {
  @IsOptional()
  @IsNumber()
  franchiseId?: number;
  @IsOptional()
  @IsNumber()
  paymentGatewayId?: number;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countryCode?: string[];
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currencyCode?: string[];
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
  @IsOptional()
  @IsBoolean()
  supportsDomestic?: boolean;
  @IsOptional()
  @IsBoolean()
  supportsInternational?: boolean;
  @IsOptional()
  @IsBoolean()
  supportsEmi?: boolean;
  @IsOptional()
  @IsBoolean()
  supportsUpi?: boolean;
  @IsOptional()
  @IsNumber()
  @Min(0)
  settlementDelayDays?: number;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  gatewayFeePercentage?: number;
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

