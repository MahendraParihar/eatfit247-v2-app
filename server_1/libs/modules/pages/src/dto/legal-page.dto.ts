import { IsBoolean, IsNotEmpty, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IManageLegalPage, InputLengthEnum } from '@eatfit247-shared-lib';
import { MediaUploadDto, SeoDto } from '@server_1/core';

export class CreateLegalPageDto implements IManageLegalPage {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  title!: string;
  @IsNotEmpty()
  details!: string;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];
  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;
  legalPageId?: number;

  @ValidateNested()
  @Type(() => SeoDto)
  seo!: SeoDto;
}

