import { IsBoolean, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { InputLengthEnum, IManageIssueCategory } from 'eatfit247-shared-lib';

export class CreateIssueCategoryDto implements IManageIssueCategory {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  issueCategory: string;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  issueCategoryId?: number;
}

