import { IsBoolean, IsNotEmpty, IsOptional, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputLengthEnum, IManageHealthIssue } from 'eatfit247-shared-lib';
import { MediaUploadDto } from '@server/common';

export class CreateHealthIssueDto implements IManageHealthIssue {
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_50)
  @IsNotEmpty()
  healthIssue: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  healthIssueId?: number;
  imagePath?: any;
}

