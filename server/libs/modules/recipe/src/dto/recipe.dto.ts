import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageRecipe } from 'eatfit247-shared-lib';
import { MediaUploadDto, SeoDto } from '@server/common';

export class CreateRecipeDto extends SeoDto implements IManageRecipe {
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
  recipeId?: number;
}

