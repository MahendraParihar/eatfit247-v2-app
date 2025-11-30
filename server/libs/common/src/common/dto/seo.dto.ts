import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ICommonSEO } from 'eatfit247-shared-lib';

export class SeoDto implements ICommonSEO {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  tags?: string[];
  @IsOptional()
  @IsString()
  metaTitle?: string;
  @IsOptional()
  @IsString()
  metaDescription?: string;
  @IsOptional()
  @IsString()
  url?: string;
}

