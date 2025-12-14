import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManagePressMedia, PressMediaType } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreatePressMediaDto implements IManagePressMedia {
  @IsOptional()
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_200)
  @IsString()
  title?: string;

  @IsNotEmpty()
  @IsEnum(['youtube', 'press'] as const)
  type: PressMediaType;

  @IsNotEmpty()
  @IsString()
  link: string;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];

  pressMediaId?: number;
}

