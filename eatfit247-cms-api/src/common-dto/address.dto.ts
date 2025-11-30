import { IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength } from 'class-validator';
import { InputLength } from '../constants/input-length';
import { IAddressBasic, IManageAddress } from '@eatfit247-common/lib';

export class AddressBasicDto implements IAddressBasic {
  @IsNotEmpty()
  @MaxLength(InputLength.MAX_ADDRESS)
  @MinLength(InputLength.MIN_ADDRESS)
  postalAddress: string;
  @IsOptional()
  @IsNumber()
  addressId: number;
  @IsNotEmpty()
  @MaxLength(InputLength.MAX_ADDRESS)
  @MinLength(InputLength.MIN_ADDRESS)
  cityVillage: string;
  @IsNotEmpty()
  countryId: number;
  @IsNumber()
  @IsOptional()
  stateId?: number;
  @MaxLength(InputLength.PIN_CODE)
  @MinLength(InputLength.PIN_CODE)
  pinCode: string;
  @IsNumber()
  @IsOptional()
  addressTypeId?: number;
  @IsOptional()
  @IsNumber()
  latitude?: number;
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class AddressDto extends AddressBasicDto implements IManageAddress {
  @IsNotEmpty()
  @IsNumber()
  tableId: number;
  @IsNotEmpty()
  @IsNumber()
  pkOfTable: number;
}
