import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** Input for adding shipment items (memberProductOrderItemId + quantity) */
export interface IShipmentItemInput {
  memberProductOrderItemId: number;
  quantity: number;
}

export class ShipmentItemDto {
  @IsNotEmpty()
  @IsNumber()
  memberProductOrderItemId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateDraftShipmentDto {
  @IsNotEmpty()
  @IsNumber()
  memberProductId: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipmentItemDto)
  items?: ShipmentItemDto[];
}

export class BookShipmentDto {
  @IsOptional()
  @IsNumber()
  rateQuoteId?: number;

  @IsOptional()
  @IsNumber()
  providerId?: number;
}

export class AddShipmentItemsDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipmentItemDto)
  items: ShipmentItemDto[];
}

export class SelectRateDto {
  @IsOptional()
  @IsNumber()
  rateQuoteId?: number;

  @IsOptional()
  @IsNumber()
  providerId?: number;
}

export class CreateShipmentDto {
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
  rateAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

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
  rateAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ShipmentItemDto)
  items?: ShipmentItemDto[];
}

