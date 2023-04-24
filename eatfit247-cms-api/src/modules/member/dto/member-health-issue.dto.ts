import { IsNumber } from 'class-validator';

export class CreateMemberHealthIssueDto {
  @IsNumber({}, { each: true })
  healthIssueIds: number[];
}
