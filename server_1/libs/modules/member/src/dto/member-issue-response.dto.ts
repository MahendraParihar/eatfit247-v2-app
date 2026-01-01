import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';
import { IManageMemberIssueResponse, InputLengthEnum } from '@eatfit247-shared-lib';

export class CreateMemberIssueResponseDto implements IManageMemberIssueResponse  {
  @IsNotEmpty()
  @IsNumber()
  memberIssueId!: number;
  @IsNotEmpty()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_1000)
  response!: string;
}
