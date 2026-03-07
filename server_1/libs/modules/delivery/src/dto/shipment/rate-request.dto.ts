import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IShipmentItemDimensions } from '@eatfit247-shared-lib';

export class ShipmentAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postcode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  pincode?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  address!: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  address2?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone!: string;
}

export class ShipmentDimensionsDto implements IShipmentItemDimensions {
  @IsNumber()
  @Min(0)
  length!: number;

  @IsNumber()
  @Min(0)
  breadth!: number;

  @IsNumber()
  @Min(0)
  height!: number;

  @IsNumber()
  @Min(0)
  width!: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  mode?: string;
}

export class RateRequestDto {
  @IsOptional()
  @IsNumber()
  shipmentId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  shipmentNumber?: string;

  @ValidateNested()
  @Type(() => ShipmentAddressDto)
  pickup!: ShipmentAddressDto;

  @ValidateNested()
  @Type(() => ShipmentAddressDto)
  delivery!: ShipmentAddressDto;

  @IsOptional()
  @IsObject()
  billing?: ShipmentAddressDto;

  @IsOptional()
  @IsNumber()
  pickupPostcode?: number;

  @IsOptional()
  @IsNumber()
  deliveryPostcode?: number;

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
}
