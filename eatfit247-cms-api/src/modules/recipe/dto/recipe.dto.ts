import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, ValidateNested } from 'class-validator';
import { InputLength } from '../../../constants/input-length';
import { Type } from 'class-transformer';
import { MediaUploadDto } from '../../../common-dto/media-upload.dto';
import { BasicSearchDto } from 'src/common-dto/basic-input.dto';

export class CreateRecipeDto {
  @MaxLength(InputLength.CHAR_100)
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  details: string;

  @IsNotEmpty()
  preparationMethod: string;

  @IsNotEmpty()
  benefits: string;

  @IsNotEmpty()
  ingredients: string;

  @IsNotEmpty()
  recipeCategoryIds: number[];

  @IsNotEmpty()
  recipeCuisineIds: number[];

  @IsNotEmpty()
  @IsNumber()
  recipeTypeId: number;

  @IsNotEmpty()
  @IsNumber()
  servingCount: number;

  @IsNotEmpty()
  @IsBoolean()
  isVisibleToAll: boolean;

  @IsNotEmpty()
  tags: string[];

  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;
}

export class RecipeFilterDto extends BasicSearchDto {
  @IsOptional()
  recipeCategoryIds?: string;

  @IsOptional()
  recipeCuisineIds?: string;

  @IsOptional()
  recipeTypeId?: number;
}
