import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  IManageProduct,
  InputLengthEnum,
  IProductBenefit,
  IProductConsumptionInstructions,
  IProductFAQ,
  IProductIngredient,
  IProductSize,
} from '@eatfit247-shared-lib';
import { MediaUploadDto } from '@server_1/core';

class ProductSizeDto implements IProductSize {
  @IsNotEmpty()
  @IsString()
  value!: string;

  @IsNotEmpty()
  @IsString()
  label!: string;

  @IsNotEmpty()
  @IsNumber()
  price!: number;
}

class ProductIngredientDto implements IProductIngredient {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class ProductBenefitDto implements IProductBenefit {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

class ProductConsumptionTimingDto {
  @IsNotEmpty()
  @IsString()
  morning!: string;

  @IsNotEmpty()
  @IsString()
  evening!: string;
}

class ProductConsumptionInstructionsDto
  implements IProductConsumptionInstructions
{
  @IsNotEmpty()
  @IsString()
  amount!: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  methods!: string[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ProductConsumptionTimingDto)
  timing!: ProductConsumptionTimingDto;
}

class ProductFAQDto implements IProductFAQ {
  @IsNotEmpty()
  @IsString()
  question!: string;

  @IsNotEmpty()
  @IsString()
  answer!: string;
}

export class CreateProductDto implements IManageProduct {
  @IsNotEmpty()
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsString()
  name!: string;

  @IsNotEmpty()
  @MinLength(InputLengthEnum.CHAR_2)
  @MaxLength(InputLengthEnum.CHAR_100)
  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  priceRange!: {
    min: number;
    max: number;
  };

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSizeDto)
  sizes!: ProductSizeDto[];

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  benefits!: string[];

  @IsNotEmpty()
  @MaxLength(InputLengthEnum.CHAR_200)
  @IsString()
  dose!: string;

  @IsNotEmpty()
  @IsString()
  howToTake!: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  precautions!: string[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIngredientDto)
  ingredients!: ProductIngredientDto[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ProductConsumptionInstructionsDto)
  consumptionInstructions!: ProductConsumptionInstructionsDto;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductBenefitDto)
  outcomes!: ProductBenefitDto[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductFAQDto)
  faqs!: ProductFAQDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaUploadDto)
  images?: MediaUploadDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @IsNotEmpty()
  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @IsNumber()
  productId?: number;
}

