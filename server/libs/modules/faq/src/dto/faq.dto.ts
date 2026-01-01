import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { InputLengthEnum, IManageFaq } from '@eatfit247-shared-lib';

export class CreateFaqDto implements IManageFaq {
  @MaxLength(InputLengthEnum.CHAR_500)
  @IsNotEmpty()
  faq: string;

  @IsNotEmpty()
  @IsNumber()
  faqCategoryId: number;

  @IsNotEmpty()
  answer: string;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsOptional()
  @IsNumber()
  faqId?: number;
}

