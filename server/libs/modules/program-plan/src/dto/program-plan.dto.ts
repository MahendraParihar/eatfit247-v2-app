import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageProgramPlan } from 'eatfit247-shared-lib';
import { MediaUploadDto, SeoDto } from '@server/common';

export class CreateProgramPlanDto extends SeoDto implements IManageProgramPlan {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  plan: string;
  @IsOptional()
  details?: string;
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
  imagePath?: MediaUploadDto[];
  programPlanId?: number;
}

