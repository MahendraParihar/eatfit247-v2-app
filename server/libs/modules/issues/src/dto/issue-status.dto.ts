import { IsBoolean, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { InputLengthEnum, IManageIssueStatus } from 'eatfit247-shared-lib';

export class CreateIssueStatusDto implements IManageIssueStatus {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  issueStatus: string;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  issueStatusId?: number;
}

