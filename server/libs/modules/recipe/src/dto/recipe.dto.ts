import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageRecipe } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

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

  @IsOptional()
  preparationMethod?: string;

  @IsOptional()
  ingredient?: string;

  @IsOptional()
  howToMake?: string;

  @IsOptional()
  benefits?: string;

  @IsNotEmpty()
  @IsNumber()
  servingCount: number;

  @IsOptional()
  tags?: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_100)
  downloadPath?: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_250)
  url?: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_60)
  metaTitle?: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_160)
  metaDescription?: string;

  @IsNotEmpty()
  @IsBoolean()
  isVisibleToAll: boolean;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  recipeId?: number;
  imagePath?: any;
}

