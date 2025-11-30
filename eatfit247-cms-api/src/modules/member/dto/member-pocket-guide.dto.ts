import { IManageMemberPocketGuide } from '@eatfit247-common/lib';
import { IsNumber } from 'class-validator';

export class CreateMemberPocketGuideDto implements IManageMemberPocketGuide {
  @IsNumber({}, { each: true })
  pocketGuideIds: number[];
}
