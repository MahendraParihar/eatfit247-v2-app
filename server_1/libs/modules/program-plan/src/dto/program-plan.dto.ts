import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IManageProgramPlan, InputLengthEnum } from '@eatfit247-shared-lib';
import { MediaUploadDto } from '@server_1/core';

export class ProgramPlanFeeDto {
  @IsNotEmpty()
  @IsString()
  currencyCode!: string;
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  fees!: number;
}

export class CreateProgramPlanDto implements IManageProgramPlan {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  plan!: string;
  @IsOptional()
  details?: string;
  @IsNotEmpty()
  @IsNumber()
  sequenceNumber!: number;
  @IsNotEmpty()
  @IsNumber()
  noOfCycle!: number;
  @IsNotEmpty()
  @IsNumber()
  noOfDaysInCycle!: number;
  @IsNotEmpty()
  @IsBoolean()
  isOnline!: boolean;
  @IsNotEmpty()
  @IsBoolean()
  isVisibleOnWeb!: boolean;
  /** UAE VAT ER Art 23 classification; stored only */
  @IsOptional()
  @IsBoolean()
  isElectronicService?: boolean;
  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];
  @IsOptional()
  @IsNumber()
  programPlanId?: number;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramPlanFeeDto)
  programPlanFees!: ProgramPlanFeeDto[];
}

