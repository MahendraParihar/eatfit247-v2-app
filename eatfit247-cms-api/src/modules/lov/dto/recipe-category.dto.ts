import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateLovDto } from './lov.dto';

export class CreateRecipeCategoryDto extends CreateLovDto {
  @IsNotEmpty()
  fromTime: string;

  @IsNotEmpty()
  toTime: string;

  @IsNotEmpty()
  @IsNumber()
  sequence: number;
}
