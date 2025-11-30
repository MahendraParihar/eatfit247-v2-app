import { IMediaUpload } from '@eatfit247-common/lib';
import { IsNotEmpty } from 'class-validator';
import { Optional } from '@nestjs/common';

export class MediaUploadDto implements IMediaUpload {
  @IsNotEmpty()
  fieldName: string;
  @IsNotEmpty()
  originalName: string;
  @IsNotEmpty()
  encoding: string;
  @IsNotEmpty()
  mimetype: string;
  @IsNotEmpty()
  fileName: string;
  @Optional()
  path: string;
  @IsNotEmpty()
  size: number;
  @IsNotEmpty()
  webUrl: string;
}
