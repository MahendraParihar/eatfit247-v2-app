import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  IDietPlanDetail,
  IDietPlanRecipes,
  IDropdownItem,
  IMemberDietPlanDetail,
  IMemberDietTemplate,
} from '@eatfit247-shared-lib';

export class MemberDietPlanDetailDto implements IMemberDietPlanDetail {
  @IsNotEmpty()
  @Type(() => Date)
  startDate: Date;
  @IsNotEmpty()
  @Type(() => Date)
  endDate: Date;
  @IsNumber()
  @IsNotEmpty()
  @Max(64)
  @Min(1)
  cycleNo: number;
  @IsOptional()
  @IsNumber()
  @Max(365)
  @Min(1)
  dayNo: number;
  @IsNumber()
  @IsNotEmpty()
  dietPlanId: number;
  @ValidateNested({ each: true })
  @Type(() => DietPlanDetailDto)
  dietPlan: DietPlanDetailDto[];
}

export class DietPlanDetailDto implements IDietPlanDetail {
  @IsOptional()
  @IsString()
  dietDetail: string;
  @IsString()
  @IsNotEmpty()
  recipeCategory: string;
  @IsNumber()
  @IsNotEmpty()
  recipeCategoryId: number;
  @IsNumber({}, { each: true })
  recipeIds: number[];
  @IsOptional()
  @IsNumber()
  sequence: number;
  @IsOptional()
  recipeList: IDropdownItem[] | IDietPlanRecipes[];
}

export class MemberDietTemplateDto implements IMemberDietTemplate {
  @IsNumber()
  @IsNotEmpty()
  dietTemplateId: number;
  @IsNumber()
  @IsNotEmpty()
  memberDietPlanId: number;
}

