import { IsNotEmpty, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { InputLength } from '../../../constants/input-length';
import { MediaUploadDto } from '../../../common-dto/media-upload.dto';
import { Type } from 'class-transformer';

export class CreateLovDto {
  @MinLength(InputLength.CHAR_2)
  @MaxLength(InputLength.CHAR_50)
  @IsNotEmpty()
  name: number;

  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  uploadFiles?: MediaUploadDto[];

  @IsNotEmpty()
  active: boolean;
}
