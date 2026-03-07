import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { IManageCourierProviderWarehouse } from '@eatfit247-shared-lib';

export class CreateCourierProviderWarehouseDto implements IManageCourierProviderWarehouse {
  @IsNotEmpty()
  @IsNumber()
  warehouseId!: number;

  @IsNotEmpty()
  @IsNumber()
  providerId!: number;

  @IsOptional()
  @MaxLength(100)
  @IsString()
  providerWarehouseId?: string;

  @IsOptional()
  @MaxLength(150)
  @IsString()
  providerWarehouseName?: string;

  @IsOptional()
  rawResponse?: Record<string, unknown>;

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @IsNumber()
  courierProviderWarehouseId?: number;
}
