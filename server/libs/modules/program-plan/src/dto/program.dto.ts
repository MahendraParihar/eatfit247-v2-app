import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageProgram } from '@eatfit247-shared-lib';
import { MediaUploadDto, SeoDto } from '@server/common';

export class CreateProgramDto implements IManageProgram {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsNotEmpty()
  program: string;
  @IsNotEmpty()
  @IsNumber()
  programCategoryId: number;
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
  @IsNotEmpty()
  @IsBoolean()
  active: boolean;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];
  @IsOptional()
  @IsNumber()
  programId?: number;
  @ValidateNested()
  @Type(() => SeoDto)
  seo: SeoDto;
}

