import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IManageMemberHealthParameterLog, InputLengthEnum } from 'eatfit247-shared-lib';

export class CreateMemberHealthParameterDto {
  @IsNotEmpty()
  @IsNumber()
  healthParameterId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  value: string;

  @IsNotEmpty()
  @IsNumber()
  healthParameterUnitId: number;
}

export class CreateMemberHealthParameterLogDto implements IManageMemberHealthParameterLog {
  @IsOptional()
  @IsNumber()
  memberHealthParameterLogId?: number;

  @IsNotEmpty()
  @IsNumber()
  memberId: number;

  @IsNotEmpty()
  @IsDateString()
  logDate: Date;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMemberHealthParameterDto)
  healthParameters: CreateMemberHealthParameterDto[];
}
