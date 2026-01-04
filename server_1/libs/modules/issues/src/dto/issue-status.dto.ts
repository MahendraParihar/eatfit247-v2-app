import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength } from 'class-validator';
import { IManageIssueStatus, InputLengthEnum } from '@eatfit247-shared-lib';

export class CreateIssueStatusDto implements IManageIssueStatus {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  issueStatus!: string;

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @IsNumber()
  issueStatusId?: number;
}

