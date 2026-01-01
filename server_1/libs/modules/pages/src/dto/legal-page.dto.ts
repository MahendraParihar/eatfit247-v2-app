import { IsBoolean, IsNotEmpty, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageLegalPage } from '@eatfit247-shared-lib';
import { MediaUploadDto } from '@server_1/core';

export class CreateLegalPageDto implements IManageLegalPage {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  title!: string;

  @IsNotEmpty()
  details!: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_250)
  url?: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_50)
  metaTitle?: string;

  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_200)
  metaDescription?: string;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  legalPageId?: number;
}

