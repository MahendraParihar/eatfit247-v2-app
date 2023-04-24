import { IsBoolean, IsNotEmpty, IsNumber, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLength } from '../../../constants/input-length';
import { MediaUploadDto } from '../../../common-dto/media-upload.dto';

export class CreatePlanDto {
  @MinLength(InputLength.CHAR_2)
  @MaxLength(InputLength.CHAR_50)
  @IsNotEmpty()
  title: string;

  @MinLength(InputLength.CHAR_2)
  @IsNotEmpty()
  details: string;

  @IsNotEmpty()
  @IsNumber()
  inrAmount: number;

  @IsNotEmpty()
  @IsNumber()
  noOfCycle: number;

  @IsNotEmpty()
  @IsNumber()
  programPlanTypeId: number;

  @IsNotEmpty()
  @IsBoolean()
  isOnline: boolean;

  @IsNotEmpty()
  @IsBoolean()
  isVisibleOnWeb: boolean;

  @IsNotEmpty()
  @IsNumber()
  noOfDaysInCycle: number;

  @IsNotEmpty()
  @IsNumber()
  sequenceNumber: number;

  @IsNotEmpty()
  tags: string[];

  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  @IsNotEmpty()
  active: boolean;
}
