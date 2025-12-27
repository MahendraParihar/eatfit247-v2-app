import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { InputLengthEnum } from 'eatfit247-shared-lib';

export class CreateMemberIssueResponseDto {
  @IsOptional()
  @IsNumber()
  memberIssueId?: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_1000)
  response: string;

  @IsOptional()
  isLatest?: boolean;
}
