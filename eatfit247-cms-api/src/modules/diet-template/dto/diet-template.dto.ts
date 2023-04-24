import { IsBoolean, IsNotEmpty, IsNumber, Max, MaxLength, Min } from 'class-validator';
import { InputLength } from '../../../constants/input-length';

export class CreateDietTemplateDto {
  @MaxLength(InputLength.CHAR_100)
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Max(64)
  @Min(1)
  noOfCycle: number;

  @IsNotEmpty()
  @IsNumber()
  @Max(364)
  @Min(1)
  noOfDaysInCycle: number;

  @IsNotEmpty()
  @IsBoolean()
  isWeekly: boolean;

  @IsNotEmpty()
  active: boolean;
}
