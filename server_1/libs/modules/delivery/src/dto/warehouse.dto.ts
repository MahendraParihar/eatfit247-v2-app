import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IManageWarehouse, InputLengthEnum } from '@eatfit247-shared-lib';

export class CreateWarehouseDto implements IManageWarehouse {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(150)
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @MaxLength(150)
  @IsString()
  contactName?: string;

  @IsOptional()
  @MaxLength(150)
  @IsString()
  email?: string;

  @IsOptional()
  @MaxLength(20)
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsString()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(100)
  @IsNotEmpty()
  @IsString()
  city!: string;

  @IsNotEmpty()
  @IsNumber()
  stateId!: number;

  @IsNotEmpty()
  @IsNumber()
  countryId!: number;

  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(10)
  @IsNotEmpty()
  @IsString()
  pinCode!: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @IsNumber()
  warehouseId?: number;
}
