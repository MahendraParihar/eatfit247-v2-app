import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ShipmentItemDto {
  @IsNotEmpty()
  @IsNumber()
  orderItemId: number;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  weightKg?: number;
}

export class CreateShipmentDto {
  @IsNotEmpty()
  @IsNumber()
  orderId: number;

  @IsNotEmpty()
  @IsNumber()
  memberId: number;

  @IsNotEmpty()
  @IsNumber()
  franchiseId: number;

  @IsOptional()
  @IsNumber()
  providerId?: number;

  @IsOptional()
  @IsNumber()
  providerAccountId?: number;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @IsOptional()
  @IsNumber()
  totalWeightKg?: number;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsNumber()
  codAmount?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ShipmentItemDto)
  items?: ShipmentItemDto[];
}

export class UpdateShipmentDto {
  @IsOptional()
  @IsNumber()
  providerId?: number;

  @IsOptional()
  @IsNumber()
  providerAccountId?: number;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @IsOptional()
  @IsNumber()
  totalWeightKg?: number;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsNumber()
  codAmount?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ShipmentItemDto)
  items?: ShipmentItemDto[];
}

