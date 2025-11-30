import { IsBoolean, IsNotEmpty, MaxLength } from 'class-validator';
import { InputLengthEnum, IManageFaqCategory } from 'eatfit247-shared-lib';

export class CreateFaqCategoryDto implements IManageFaqCategory {
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  faqCategory: string;

  @MaxLength(InputLengthEnum.CHAR_250)
  url?: string;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  faqCategoryId?: number;
}

