import { IsNotEmpty, IsOptional } from 'class-validator';
import { IMediaUpload } from 'eatfit247-shared-lib';

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

  @IsOptional()
  path?: string;

  @IsNotEmpty()
  size: number;

  @IsNotEmpty()
  webUrl: string;
}

