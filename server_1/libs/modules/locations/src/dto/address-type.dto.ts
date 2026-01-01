import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength } from 'class-validator';
import { InputLengthEnum, IManageAddressType } from '@eatfit247-shared-lib';

export class CreateAddressTypeDto implements IManageAddressType {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  addressType!: string;

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @IsNumber()
  addressTypeId?: number;
}
