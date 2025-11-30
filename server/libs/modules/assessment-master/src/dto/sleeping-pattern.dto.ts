import { IsBoolean, IsNotEmpty, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageSleepingPattern } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateSleepingPatternDto implements IManageSleepingPattern {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  sleepingPattern: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  sleepingPatternId?: number;
  imagePath?: any;
}

