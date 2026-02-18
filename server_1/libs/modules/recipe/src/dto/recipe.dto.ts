import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IManageRecipe, InputLengthEnum } from '@eatfit247-shared-lib';
import { MediaUploadDto } from '@server_1/core';

export class CreateRecipeDto implements IManageRecipe {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(255)
  @IsNotEmpty()
  name: string;
  @IsNotEmpty()
  @IsNumber()
  recipeTypeId: number;
  @IsOptional()
  details?: string;
  @IsNotEmpty()
  ingredient?: string;
  @IsOptional()
  howToMake?: string;
  @IsOptional()
  benefits?: string;
  @IsNotEmpty()
  @IsNumber()
  servingCount: number;
  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_100)
  downloadPath?: MediaUploadDto[];
  @IsNotEmpty()
  @IsBoolean()
  isVisibleToAll: boolean;
  @IsNotEmpty()
  @IsBoolean()
  active: boolean;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath: MediaUploadDto[];
  @IsOptional()
  @IsNumber()
  recipeId?: number;
  @IsNumber({}, { each: true })
  @Type(() => Number)
  recipeCategoryIds: number[];
  @IsNumber({}, { each: true })
  @Type(() => Number)
  recipeCuisineIds: number[];
}

