import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageDietTemplate, IDietTemplateDetail } from 'eatfit247-shared-lib';

export class CreateDietTemplateDto implements IManageDietTemplate {
  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_100)
  dietTemplate: string;

  @IsNotEmpty()
  @IsNumber()
  cycleNo: number;

  @IsNotEmpty()
  @IsNumber()
  dayNo: number;

  @IsOptional()
  @IsNumber()
  noOfCycle?: number;

  @IsOptional()
  @IsNumber()
  noOfDaysInCycle?: number;

  @IsNotEmpty()
  @IsBoolean()
  isWeekly: boolean;

  @IsOptional()
  @IsNumber()
  dietTemplateId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  dietDetail?: IDietTemplateDetail;
}
