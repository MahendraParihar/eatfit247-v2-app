import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManagePocketGuide } from '@eatfit247-shared-lib';
import { MediaUploadDto } from '@server_1/core';

export class CreatePocketGuideDto implements IManagePocketGuide {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  pocketGuide!: string;

  @IsOptional()
  description?: string;

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  filePath?: MediaUploadDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];

  @IsOptional()
  @IsNumber()
  pocketGuideId?: number;
}

