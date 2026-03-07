import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { ShipmentAddressDto, ShipmentDimensionsDto } from './rate-request.dto';

class BookingItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

export class BookingRequestDto {
  @IsOptional()
  @IsNumber()
  shipmentId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  shipmentNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShipmentAddressDto)
  pickup?: ShipmentAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShipmentAddressDto)
  delivery?: ShipmentAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShipmentAddressDto)
  billing?: ShipmentAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShipmentAddressDto)
  shipping?: ShipmentAddressDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  subTotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  codAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShipmentDimensionsDto)
  dimensions?: ShipmentDimensionsDto;

  @IsOptional()
  @IsNumber()
  rateQuoteId?: number;

  @IsOptional()
  @IsNumber()
  providerId?: number;

  @IsOptional()
  @IsNumber()
  providerAccountId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  idempotencyKey?: string;

  @ValidateIf((obj) => obj.forceRetry !== undefined)
  @IsBoolean()
  forceRetry?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  orderId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  orderNumber?: string;

  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @IsOptional()
  @IsBoolean()
  shippingIsBilling?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pickupLocation?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingItemDto)
  items?: BookingItemDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
