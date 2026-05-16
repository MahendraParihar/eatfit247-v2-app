import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  IDietPlanDetail,
  IDietPlanRecipes,
  IDropdownItem,
  IManageDietTemplate,
  InputLengthEnum,
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
  @IsNumber()
  programId?: number;
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
  @Min(0)
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
