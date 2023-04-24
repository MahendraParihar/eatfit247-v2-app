import { IsNumber } from 'class-validator';

export class CreateMemberPocketGuideDto {
  @IsNumber({}, { each: true })
  pocketGuideIds: number[];
}
