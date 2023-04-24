import { IsNotEmpty, IsNumber, MaxLength } from 'class-validator';
import { InputLength } from '../../../constants/input-length';

export class CreateFaqDto {
  @MaxLength(InputLength.CHAR_500)
  @IsNotEmpty()
  faq: string;

  @IsNotEmpty()
  @IsNumber()
  faqCategoryId: number;

  @IsNotEmpty()
  answer: string;

  @IsNotEmpty()
  active: boolean;
}
