import { IsBoolean, IsNotEmpty, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageBloodSugar } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateBloodSugarDto implements IManageBloodSugar {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  bloodSugar: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  bloodSugarId?: number;
}

