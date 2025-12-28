import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  IAvailableSlot,
  IManageMemberCallLog,
  InputLengthEnum,
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

export class CreateMemberCallLogDto implements IManageMemberCallLog {
  @IsOptional()
  @IsNumber()
  memberCallLogId?: number;
  @IsNotEmpty()
  @IsNumber()
  memberId: number;
  @IsNotEmpty()
  @IsDateString()
  date: Date;
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
  @IsNotEmpty()
  @IsNumber()
  callLogStatusId: number;
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_250)
  detail: string;
  @IsOptional()
  @IsString()
  @MaxLength(InputLengthEnum.CHAR_250)
  conversionHistory: string;
  @IsOptional()
  @IsBoolean()
  isMailSuccess: boolean;
  @IsOptional()
  @IsNumber()
  nutritionistId: number;
  @IsOptional()
  @IsString()
  meetingLink: string;
  @IsOptional()
  @IsString()
  calendarEventId: string;
  @IsOptional()
  @IsBoolean()
  isSystemGenerated: boolean;
  @IsOptional()
  @IsBoolean()
  active: boolean;
}
