import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSeoPageDto {
  @IsNotEmpty()
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ogType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ogTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogDescription?: string;

  @IsOptional()
  @IsString()
  ogUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  twitterCard?: string;

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;
}

export class UpdateSeoPageDto extends CreateSeoPageDto {
  @IsOptional()
  seoPageId?: number;
}

