import { IsBoolean, IsNotEmpty, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageEatingHabit } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateEatingHabitDto implements IManageEatingHabit {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  eatingHabit: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  eatingHabitId?: number;
  imagePath?: any;
}

