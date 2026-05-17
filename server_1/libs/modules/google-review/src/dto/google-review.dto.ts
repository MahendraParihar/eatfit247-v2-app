import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  GoogleReviewEntityTypeEnum,
  GoogleReviewSourceEnum,
  IGoogleReviewReply,
  IManageGoogleReview,
} from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/core';

export class CreateGoogleReviewDto implements IManageGoogleReview {
  @IsNotEmpty()
  @IsEnum(GoogleReviewEntityTypeEnum)
  entityType!: GoogleReviewEntityTypeEnum;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  entityId!: number;

  @IsNotEmpty()
  @IsEnum(GoogleReviewSourceEnum)
  source!: GoogleReviewSourceEnum;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  googleReviewIdExt?: string | null;

  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  reviewerName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reviewerRole?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewerPhotoUrl?: string | null;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  reviewText?: string | null;

  @IsNotEmpty()
  @IsDateString()
  reviewDate!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language!: string;

  @IsNotEmpty()
  @IsBoolean()
  isPublished!: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder!: number;

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @IsNumber()
  googleReviewId?: number;
}

export class GoogleReviewReplyDto implements IGoogleReviewReply {
  @IsNotEmpty()
  @IsString()
  adminReply!: string;
}

export class GoogleReviewSearchDto extends BasicSearchDto {
  @IsOptional()
  @IsEnum(GoogleReviewEntityTypeEnum)
  entityType?: GoogleReviewEntityTypeEnum;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entityId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsEnum(GoogleReviewSourceEnum)
  source?: GoogleReviewSourceEnum;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublished?: boolean;
}

export class PublicGoogleReviewQueryDto {
  @IsNotEmpty()
  @IsEnum(GoogleReviewEntityTypeEnum)
  entityType!: GoogleReviewEntityTypeEnum;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  entityId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}
