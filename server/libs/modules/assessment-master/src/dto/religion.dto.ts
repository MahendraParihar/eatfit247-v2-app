import { IsBoolean, IsNotEmpty, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageReligion } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateReligionDto implements IManageReligion {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  religion: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  religionId?: number;
}

