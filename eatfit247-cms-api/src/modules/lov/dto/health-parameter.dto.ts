import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateLovDto } from './lov.dto';
import { FieldTypeEnum } from '../../../enums/field-type-enum';
import { InputLength } from '../../../constants/input-length';

export class CreateHealthParameterDto extends CreateLovDto {
  @IsNotEmpty()
  @IsNumber()
  sequence: number;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  @MaxLength(InputLength.CHAR_50)
  hintText?: string;

  @IsEnum(FieldTypeEnum)
  @IsNotEmpty()
  fieldType: FieldTypeEnum;

  @IsBoolean()
  @IsNotEmpty()
  requiredField: boolean;
}
