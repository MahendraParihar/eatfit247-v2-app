import { IsBoolean, IsNotEmpty } from 'class-validator';
import { IStatusChange } from 'eatfit247-shared-lib';

export class StatusChangeDto implements IStatusChange {
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;
}
