import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageHealthParameter } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateHealthParameterDto implements IManageHealthParameter {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  healthParameter: string;

  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  hintText: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];

  @IsNotEmpty()
  @IsBoolean()
  isLength: boolean;

  @IsNotEmpty()
  @IsNumber()
  sequence: number;

  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_50)
  fieldType: string;

  @IsNotEmpty()
  @IsBoolean()
  requiredField: boolean;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  healthParameterId?: number;
}

