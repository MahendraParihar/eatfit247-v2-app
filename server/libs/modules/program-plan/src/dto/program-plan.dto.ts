import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageProgramPlan } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateProgramPlanDto implements IManageProgramPlan {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  plan: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_250)
  url?: string; // Optional because it can be auto-generated

  @IsOptional()
  details?: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_1000)
  tags?: string;

  @IsNotEmpty()
  @IsNumber()
  sequenceNumber: number;

  @IsNotEmpty()
  @IsNumber()
  inrAmount: number;

  @IsNotEmpty()
  @IsNumber()
  noOfCycle: number;

  @IsNotEmpty()
  @IsNumber()
  noOfDaysInCycle: number;

  @IsNotEmpty()
  @IsNumber()
  programPlanTypeId: number;

  @IsNotEmpty()
  @IsBoolean()
  isOnline: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isVisibleOnWeb: boolean;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  programPlanId?: number;
  imagePath?: any;
}

