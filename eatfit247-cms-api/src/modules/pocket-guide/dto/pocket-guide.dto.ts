import { IsNotEmpty, MaxLength, ValidateNested } from 'class-validator';
import { InputLength } from '../../../constants/input-length';
import { Type } from 'class-transformer';
import { MediaUploadDto } from '../../../common-dto/media-upload.dto';

export class CreatePocketGuideDto {
  @MaxLength(InputLength.CHAR_100)
  @IsNotEmpty()
  name: string;

  @MaxLength(InputLength.CHAR_1000)
  description?: string;

  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadAttachment?: MediaUploadDto[];

  @IsNotEmpty()
  active: boolean;
}
