import { IsBoolean, IsNotEmpty, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManagePocketGuide } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreatePocketGuideDto implements IManagePocketGuide {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  pocketGuide: string;

  @IsOptional()
  description?: string;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFile?: MediaUploadDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  pocketGuideId?: number;
  filePath?: any;
  imagePath?: any;
}

