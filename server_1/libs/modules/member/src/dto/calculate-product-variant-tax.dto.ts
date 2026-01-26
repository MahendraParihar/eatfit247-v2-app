import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ICalculateProductVariantTaxRequest, IProductVariantTaxItem } from '@eatfit247-shared-lib';

export class ProductVariantTaxItemDto implements IProductVariantTaxItem {
  @IsNotEmpty()
  @IsNumber()
  productId!: number;

  @IsNotEmpty()
  @IsNumber()
  productVariantId!: number;

  @IsNotEmpty()
  @IsString()
  currencyCode!: string;
}

export class CalculateProductVariantTaxDto implements ICalculateProductVariantTaxRequest {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantTaxItemDto)
  items!: ProductVariantTaxItemDto[];

  @IsOptional()
  @IsNumber()
  billingAddressId?: number;

  @IsOptional()
  @IsNumber()
  addressId?: number;
}

