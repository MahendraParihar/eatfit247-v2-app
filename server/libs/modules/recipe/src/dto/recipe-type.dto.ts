import { IsBoolean, IsNotEmpty, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageRecipeType } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateRecipeTypeDto implements IManageRecipeType {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  recipeType: string;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];

  recipeTypeId?: number;
}

