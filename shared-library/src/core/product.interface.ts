import { IAdminInfo } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IProductFee {
  /**
   * Quantity for this product option, e.g. 200, 500
   */
  quantity: number;
  /**
   * Unit for the quantity, e.g. gm, kg
   */
  unit: string;
  /**
   * Currency for the price, e.g. INR, USD
   */
  currency: string;
  /**
   * Base price for this product option
   */
  price: number;
  /**
   * Optional SKU identifier for this variant
   */
  sku?: string;
  /**
   * Optional flag to mark this price as active/inactive
   */
  isActive?: boolean;
  /**
   * Optional validity start date for this price
   */
  validFrom?: Date | string | null;
  /**
   * Optional validity end date for this price
   */
  validTo?: Date | string | null;
}

export interface IIngredient {
  name: string;
  icon?: IMediaUpload[];
  description?: string;
}

export interface IProductIngredientSection {
  title: string;
  description: string;
  ingredients: IIngredient[];
}

export interface IProjectConsumptionInstructionSection {
  title: string;
  description: string;
  mediaDirection: 'left' | 'right' | 'center';
  metaData: {
    howToConsume: string[];
  };
  videoUrl?: string;
}

export interface IProjectStarEndorsedSection {
  title: string;
  description: string;
  videoUrl: string;
}

export interface IProductAdditionalInfo {
  ingredients?: IProductIngredientSection;
  priceRange?: {
    min: number;
    max: number;
  };
  benefits?: string[];
  description?: string;
  dose?: string;
  howToTake?: string;
  precautions?: string[];
  consumptionInstructions?: IProjectConsumptionInstructionSection;
  startEndorsed?: IProjectStarEndorsedSection;
}

export interface IProductVariant {
  productVariantId?: number;
  productId?: number;
  /**
   * Quantity for this variant, e.g. 200, 500
   */
  quantityValue: number;
  /**
   * Unit for the quantity, e.g. gm, kg
   */
  quantityUnit: string;
  /**
   * Optional SKU identifier for this variant
   */
  sku?: string;
  /**
   * Prices associated with this variant
   */
  prices?: IProductPrice[];
}

export interface IProductPrice {
  id?: number;
  productVariantId?: number;
  /**
   * Currency code, e.g. INR, USD
   */
  currency: string;
  /**
   * Price amount
   */
  price: number;
  /**
   * Whether this price is currently active
   */
  active?: boolean;
  /**
   * Validity period for this price
   */
  validFrom?: Date | string | null;
  validTo?: Date | string | null;
}

export interface IProductPriceWithQuantity {
  /**
   * Quantity for this product option, e.g. 200, 500
   */
  quantity: number;
  /**
   * Unit for the quantity, e.g. gm, kg
   */
  unit: string;
  /**
   * Currency for the price, e.g. INR, USD
   */
  currency: string;
  /**
   * Base price for this product option
   */
  price: number;
  /**
   * Whether this price is currently active
   */
  active?: boolean;
  /**
   * Optional validity start date for this price
   */
  validFrom?: Date | string | null;
  /**
   * Optional validity end date for this price
   */
  validTo?: Date | string | null;
}

interface IBaseProduct {
  name: string;
  imagePath: IMediaUpload[];
  additionalInfo: IProductAdditionalInfo;
  hsnCode: string;
  /**
   * Flattened fee structure used by existing UI (quantity, unit, currency, price)
   * This is a backward-compatible format derived from variants.
   * For new implementations, prefer using the variants structure in IProduct.
   */
  fees?: IProductFee[];
}

export interface IManageProduct extends IBaseProduct {
  productId?: number;
  active: boolean;
  /**
   * Variant/price structure linked to the product
   */
  variants?: IProductVariant[];
}

export interface IProduct extends IBaseProduct, IAdminInfo {
  productId: number;
  active: boolean;
  createdIp: string;
  modifiedIp: string;
  /**
   * Variant/price structure linked to the product.
   * This is the primary structure for product variants and prices.
   * Each variant represents a quantity/unit combination (e.g., 200gm, 500gm),
   * and can have multiple prices (for different currencies or time periods).
   * The fees array is a flattened version of this structure for backward compatibility.
   */
  variants?: IProductVariant[];
}

