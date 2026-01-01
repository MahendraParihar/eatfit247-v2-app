import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';
import { InputLengthEnum, IManageMemberIssue } from '@eatfit247-shared-lib';

export class CreateMemberIssueDto implements IManageMemberIssue {
  @IsNotEmpty()
  @IsNumber()
  memberId!: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_1000)
  issue!: string;

  @IsNotEmpty()
  @IsNumber()
  issueStatusId!: number;

  @IsNotEmpty()
  @IsNumber()
  issueCategoryId!: number;
}
