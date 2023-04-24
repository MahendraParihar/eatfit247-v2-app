import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLength } from '../../../constants/input-length';
import { MediaUploadDto } from '../../../common-dto/media-upload.dto';

export class CreateProgramDto {
  @MinLength(InputLength.CHAR_2)
  @MaxLength(InputLength.CHAR_100)
  @IsNotEmpty()
  title: string;

  @MinLength(InputLength.CHAR_2)
  @IsNotEmpty()
  details: string;

  @IsNotEmpty()
  @IsNumber()
  programCategoryId: number;

  @IsNotEmpty()
  idealFor: string[];

  @IsNotEmpty()
  punchLine: string;

  @IsOptional()
  videoUrl?: string;

  @IsNotEmpty()
  @IsNumber()
  sequenceNumber: number;

  @IsNotEmpty()
  @IsBoolean()
  isSpecialProgram: boolean;

  @IsNotEmpty()
  tags: string[];

  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  @IsNotEmpty()
  active: boolean;
}
