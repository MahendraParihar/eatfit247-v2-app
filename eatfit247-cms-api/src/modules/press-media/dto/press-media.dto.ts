import { IsBoolean, IsEnum, IsNotEmpty, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLength } from '../../../constants/input-length';
import { MediaUploadDto } from '../../../common-dto/media-upload.dto';

export enum PressMediaType {
  YOUTUBE = 'youtube',
  PRESS = 'press',
}

export class CreatePressMediaDto {
  @MinLength(InputLength.CHAR_2)
  @MaxLength(InputLength.CHAR_200)
  @IsString()
  title?: string;

  @IsNotEmpty()
  @IsEnum(PressMediaType)
  type: PressMediaType;

  @IsNotEmpty()
  @IsString()
  link: string;

  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  @IsBoolean()
  active: boolean;
}

