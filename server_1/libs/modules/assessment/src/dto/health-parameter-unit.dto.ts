import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength } from 'class-validator';
import { InputLengthEnum, IManageHealthParameterUnit } from '@eatfit247-shared-lib';

export class CreateHealthParameterUnitDto implements IManageHealthParameterUnit {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  healthParameterUnit!: string;

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @IsNumber()
  healthParameterUnitId?: number;
}
