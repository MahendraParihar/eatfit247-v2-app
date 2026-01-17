import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  IManageProduct,
  IProductAdditionalInfo,
  IProductFee,
  InputLengthEnum, IOutcomeSection, IProductIngredientSection, IOutcomes, IMediaUpload, IIngredient,
} from '@eatfit247-shared-lib';
import { MediaUploadDto } from '@server_1/core';

class ProductFeeDto implements IProductFee {
  @IsNotEmpty()
  @IsNumber()
  price!: number;
  @IsNotEmpty()
  @IsString()
  currency!: string;
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;
  @IsNotEmpty()
  @IsString()
  unit!: string;
}

class OutcomeSection implements IOutcomeSection {
  @IsOptional()
  @IsString()
  title!: string;
  @IsOptional()
  @IsString()
  description!: string;
  @IsArray()
  @ValidateNested({ each: true })
  outcome: OutcomeDto[];
}

class OutcomeDto implements IOutcomes {
  @IsNotEmpty()
  @IsString()
  title!: string;
  @IsNotEmpty()
  @IsString()
  description!: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  icon?: MediaUploadDto[];
}

export class IngredientDto implements IIngredient {
  @IsOptional()
  @IsString()
  name: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsArray()
  @ValidateNested({ each: true })
  icon?: IMediaUpload[];
}

export class ProductIngredientSectionDto implements IProductIngredientSection {
  @IsOptional()
  @IsString()
  title!: string;
  @IsOptional()
  @IsString()
  description!: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  ingredients: IngredientDto[];
}

class ProductAdditionalInfoDto implements IProductAdditionalInfo {
  @IsOptional()
  @IsObject()
  ingredients?: ProductIngredientSectionDto;
  @IsOptional()
  @IsObject()
  priceRange?: {
    min: number;
    max: number;
  };
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];
  @IsOptional()
  @IsString()
  dose?: string;
  @IsOptional()
  @IsString()
  howToTake?: string;
  @IsOptional()
  @IsObject()
  feature?: {
    title: string;
    description: string;
    images: any[];
    feature: string[];
    tagLine: string;
  };
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  precautions?: string[];
  @IsOptional()
  @IsObject()
  consumptionInstructions?: {
    title: string;
    description: string;
    mediaDirection: 'left' | 'right' | 'center';
    metaData: {
      howToConsume: string[];
      whenToConsume: string[];
    };
    mediaData: {
      mediaType: 'image' | 'video';
      mediaLink: any[];
    };
  };
  @IsOptional()
  @IsObject()
  report?: {
    title: string;
    description: string;
    mediaDirection: 'left' | 'right' | 'center';
    mediaData: {
      mediaType: 'image' | 'video';
      mediaLink: any[];
    };
  };
  @IsOptional()
  @IsObject()
  @Type(() => OutcomeSection)
  outcomes?: OutcomeSection;
  @IsOptional()
  @IsObject()
  startEndorsed?: {
    title: string;
    description: string;
    mediaData: {
      mediaType: 'image' | 'video';
      mediaLink: any[];
    };
  };
}

export class CreateProductDto implements IManageProduct {
  @IsNotEmpty()
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_250)
  @IsString()
  name!: string;
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  imagePath!: MediaUploadDto[];
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductFeeDto)
  fees!: ProductFeeDto[];
  @IsObject()
  @ValidateNested()
  @Type(() => ProductAdditionalInfoDto)
  additionalInfo!: ProductAdditionalInfoDto;
  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;
  @IsOptional()
  @IsNumber()
  productId?: number;
}

