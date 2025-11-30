import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IDietPlanDetail, IMemberDietPlanDetail, IMemberDietTemplate } from '@eatfit247-common/lib';

export class MemberDietPlanDetailDto implements IMemberDietPlanDetail {
  @IsNotEmpty()
  @Type(() => Date)
  startDate: Date;
  @IsOptional()
  @Type(() => Date)
  endDate: Date;
  @IsNumber()
  @IsNotEmpty()
  @Max(64)
  @Min(1)
  cycleNo: number;
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
}

export class MemberDietTemplateDto implements IMemberDietTemplate {
  @IsNumber()
  @IsNotEmpty()
  dietTemplateId: number;
  @IsNumber()
  @IsNotEmpty()
  memberDietPlanId: number;
}
