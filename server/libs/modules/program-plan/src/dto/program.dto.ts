import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageProgram } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateProgramDto implements IManageProgram {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  program: string;

  @IsNotEmpty()
  @IsNumber()
  programCategoryId: number;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_250)
  url?: string; // Optional because it can be auto-generated

  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_250)
  punchLine: string;

  @IsNotEmpty()
  details: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_50)
  idealFor?: string;

  @IsNotEmpty()
  @IsNumber()
  sequenceNumber: number;

  @IsNotEmpty()
  @IsBoolean()
  isSpecialProgram: boolean;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_500)
  videoUrl?: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_1000)
  tags?: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_60)
  metaTitle?: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_160)
  metaDescription?: string;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  programId?: number;
  imagePath?: any;
}

