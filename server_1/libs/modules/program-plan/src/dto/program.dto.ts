import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IManageProgram, InputLengthEnum } from '@eatfit247-shared-lib';
import { MediaUploadDto, SeoDto } from '@server_1/core';
import { CreateProgramPlanDto } from './program-plan.dto';

export class CreateProgramDto implements IManageProgram {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  program!: string;
  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_250)
  punchLine!: string;
  @IsNotEmpty()
  details!: string;
  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_50)
  idealFor?: string;
  @IsNotEmpty()
  @IsNumber()
  sequenceNumber!: number;
  @IsNotEmpty()
  @IsBoolean()
  isSpecialProgram!: boolean;
  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_500)
  videoUrl?: string;
  @IsOptional()
  @IsDateString()
  startDate?: string | null;
  @IsOptional()
  @IsDateString()
  endDate?: string | null;
  @IsOptional()
  @IsInt()
  @Min(0)
  maxPeopleCanRegister?: number | null;
  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];
  @IsOptional()
  @IsNumber()
  programId?: number;
  @IsOptional()
  @IsNumber()
  programPlanId?: number | null;
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProgramPlanDto)
  programPlan?: CreateProgramPlanDto;
  @ValidateNested()
  @Type(() => SeoDto)
  seo!: SeoDto;
}
