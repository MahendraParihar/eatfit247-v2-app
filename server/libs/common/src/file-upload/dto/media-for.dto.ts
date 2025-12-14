import { IsNotEmpty } from 'class-validator';

export class MediaDto {
  @IsNotEmpty()
  mediaFor: string;

  @IsNotEmpty()
  mediaType: string;
}
