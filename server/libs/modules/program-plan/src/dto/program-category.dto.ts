import { IsBoolean, IsNotEmpty, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageProgramCategory } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateProgramCategoryDto implements IManageProgramCategory {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  programCategory: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_250)
  url?: string;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];

  programCategoryId?: number;
}

