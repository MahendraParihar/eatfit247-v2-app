import { IsNotEmpty, IsNumber, IsOptional, MaxLength, ValidateNested, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageDietTemplate, IDietTemplateDetail, IDietPlanDetail } from '@eatfit247-shared-lib';

export class CreateDietTemplateDto implements IManageDietTemplate {
  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_100)
  dietTemplate!: string;

  @IsNotEmpty()
  @IsNumber()
  cycleNo!: number;

  @IsNotEmpty()
  @IsNumber()
  dayNo!: number;

  @IsOptional()
  @IsNumber()
  noOfCycle?: number;

  @IsOptional()
  @IsNumber()
  noOfDaysInCycle?: number;

  @IsOptional()
  @IsNumber()
  dietTemplateId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  dietDetail?: IDietTemplateDetail;
}

export class DietTemplateDetailDto {
  @IsNumber()
  @IsNotEmpty()
  @Max(64)
  @Min(1)
  cycleNo: number;

  @IsOptional()
  @IsNumber()
  @Max(365)
  @Min(1)
  dayNo?: number;

  @IsNumber()
  @IsNotEmpty()
  dietTemplateId: number;

  @ValidateNested({ each: true })
  @Type(() => DietPlanDetailDto)
  dietPlan: DietPlanDetailDto[];
}

export class DietPlanDetailDto implements IDietPlanDetail {
  @IsOptional()
  dietDetail?: string;

  @IsNotEmpty()
  recipeCategory: string;

  @IsNumber()
  @IsNotEmpty()
  recipeCategoryId: number;

  @IsNumber({}, { each: true })
  recipeIds: number[];

  @IsOptional()
  @IsNumber()
  sequence?: number;

  @IsOptional()
  recipeList?: any[];
}
