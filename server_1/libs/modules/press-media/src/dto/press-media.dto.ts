import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IManagePressMedia, InputLengthEnum, PressMediaType } from '@eatfit247-shared-lib';
import { MediaUploadDto } from '@server_1/core';

export class CreatePressMediaDto implements IManagePressMedia {
  @IsOptional()
  @MaxLength(InputLengthEnum.CHAR_200)
  @IsString()
  title?: string;

  @IsNotEmpty()
  @IsEnum(['youtube', 'press'] as const)
  type!: PressMediaType;

  @IsNotEmpty()
  @IsString()
  link!: string;

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];

  @IsOptional()
  @IsNumber()
  pressMediaId?: number;
}

