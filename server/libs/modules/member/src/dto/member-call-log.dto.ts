import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  IAvailableSlot,
  ISetupMemberCallLog, IStatusChangeCallLog,
} from 'eatfit247-shared-lib';

export class AvailableSlotDto implements IAvailableSlot {
  @IsNotEmpty()
  @IsNumber()
  nutritionistId: number;
  @IsNotEmpty()
  @IsDateString()
  fromDate: string;
  @IsNotEmpty()
  @IsDateString()
  toDate: string;
  @IsNotEmpty()
  @IsNumber()
  duration: number;
}

export class CreateMemberCallLogDto implements ISetupMemberCallLog {
  @IsNotEmpty()
  @IsNumber()
  memberId: number;
  @IsNotEmpty()
  @IsString()
  startTime: Date;
  @IsNotEmpty()
  @IsString()
  endTime: Date;
  @IsNotEmpty()
  @IsNumber()
  callTypeId: number;
  @IsNotEmpty()
  @IsNumber()
  callPurposeId: number;
  @IsOptional()
  @IsNumber()
  nutritionistId: number;
  @IsOptional()
  @IsBoolean()
  notifyUser: boolean;
}

export class StatusChangeCallLogDto implements IStatusChangeCallLog {
  @IsNotEmpty()
  @IsNumber()
  memberCallLogId: number;
  @IsNotEmpty()
  @IsString()
  reason: string;
}
