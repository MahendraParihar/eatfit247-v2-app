import { IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength } from 'class-validator';

export class MemberIssueResponseDto {
  @IsNotEmpty()
  @IsNumber()
  memberIssueId: number;

  @IsNumber()
  @IsOptional()
  memberIssueResponseId: number;

  @IsNotEmpty()
  @MaxLength(1000)
  @MinLength(1)
  response: string;
}

export class MemberIssueStatusDto {
  @IsNumber()
  @IsNotEmpty()
  statusId: number;
}
