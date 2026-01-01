import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageCallType } from '@eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateCallTypeDto implements IManageCallType {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  callType: string;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath?: MediaUploadDto[];
  @IsNotEmpty()
  @IsBoolean()
  active: boolean;
  @IsOptional()
  @IsNumber()
  callTypeId?: number;
}

