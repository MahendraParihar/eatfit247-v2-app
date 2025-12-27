import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';
import { InputLengthEnum, IManageAddress } from 'eatfit247-shared-lib';

export class CreateAddressDto implements Partial<IManageAddress> {
  @IsOptional()
  @IsNumber()
  addressId?: number;
  @IsOptional()
  @IsNumber()
  tableId?: number;
  @IsOptional()
  @IsNumber()
  pkOfTable?: number;
  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_100)
  postalAddress: string;
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_100)
  cityVillage?: string;
  @IsNotEmpty()
  @IsNumber()
  countryId: number;
  @IsNotEmpty()
  @IsNumber()
  stateId: number;
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.PIN_CODE)
  pinCode?: string;
  @IsNotEmpty()
  @IsNumber()
  addressTypeId: number;
  @IsOptional()
  @IsNumber()
  latitude?: number;
  @IsOptional()
  @IsNumber()
  longitude?: number;
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_100)
  addressName?: string;
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
