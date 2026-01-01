import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageRecipeCategory } from '@eatfit247-shared-lib';
import { MediaUploadDto } from '@server_1/core';

export class CreateRecipeCategoryDto implements IManageRecipeCategory {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  recipeCategory!: string;

  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_50)
  fromTime!: string;

  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_50)
  toTime!: string;

  @IsNotEmpty()
  @IsNumber()
  sequence!: number;

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];

  @IsOptional()
  @IsNumber()
  recipeCategoryId?: number;
}

