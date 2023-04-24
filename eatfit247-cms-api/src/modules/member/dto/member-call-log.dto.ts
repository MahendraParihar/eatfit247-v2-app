import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { InputLength } from '../../../constants/input-length';
import { Type } from 'class-transformer';

export class CreateMemberCallLogDto {
  @IsNumber()
  @IsNotEmpty()
  callPurposeId: number;

  @IsNumber()
  @IsNotEmpty()
  memberId: number;

  @IsNumber()
  @IsNotEmpty()
  callStatusId: number;

  @IsNumber()
  @IsNotEmpty()
  callTypeId: number;

  @MaxLength(InputLength.CHAR_200)
  @IsOptional()
  detail?: string;

  @MaxLength(InputLength.CHAR_200)
  @IsOptional()
  conversionHistory?: string;

  @IsNotEmpty()
  @Type(() => Date)
  date: Date;

  @IsNotEmpty()
  startTime: Date;

  @IsNotEmpty()
  endTime: Date;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
