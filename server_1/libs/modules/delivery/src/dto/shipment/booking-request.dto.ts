import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
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
}

export class BookingRequestDto {
  @IsOptional()
  @IsNumber()
  shipmentId?: number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

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
  @IsNumber()
  @Min(0)
  orderAmount?: number;

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

  @ValidateIf((obj) => obj.forceRetry !== undefined)
  @IsBoolean()
  forceRetry?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingItemDto)
  items?: BookingItemDto[];
}
