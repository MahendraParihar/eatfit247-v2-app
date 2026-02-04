import { IsArray, IsOptional, IsString } from 'class-validator';
import { ICommonSEO } from '@eatfit247-shared-lib';

export class SeoDto implements ICommonSEO {
  @IsOptional()
  @IsString()
  url?: string;
}

