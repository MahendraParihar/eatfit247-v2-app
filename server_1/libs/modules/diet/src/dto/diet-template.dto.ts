import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  ValidateNested,
  Max,
  Min,
  IsString,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  InputLengthEnum,
  IManageDietTemplate,
  IDietTemplateDetail,
  IDietPlanDetail,
  IDropdownItem, IDietPlanRecipes,
} from '@eatfit247-shared-lib';

export class CreateDietTemplateDto implements IManageDietTemplate {
  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_100)
  dietTemplate!: string;
  @IsNotEmpty()
  @IsNumber()
  noOfCycle!: number;
  @IsNotEmpty()
  @IsNumber()
  noOfDaysInCycle!: number;
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
  @IsNumber()
  recipeCategoryId: number;
  @IsString()
  recipeCategory: string;
  @IsString()
  dietDetail: string;
  @IsNumber()
  sequence: number;
  @IsArray()
  recipeIds: number[];
  @IsArray()
  @IsOptional()
  recipeList: IDropdownItem[] | IDietPlanRecipes[];
}
