import { IBaseAdminUser } from '../base.interface';
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

export interface IOutcomeSection {
  title: string;
  description: string;
  outcome?: IOutcomes[];
}

export interface IOutcomes {
  title: string;
  description: string;
  icon?: IMediaUpload[];
}

export interface IProductIngredientSection {
  title: string;
  description: string;
  ingredients: IIngredient[];
}

export interface IProductReport {
  title: string;
  description: string;
  mediaDirection: 'left' | 'right' | 'center';
  mediaData: {
    mediaType: 'image' | 'video';
    mediaLink: IMediaUpload[];
  };
}

export interface IProjectConsumptionInstructionSection {
  title: string;
  description: string;
  mediaDirection: 'left' | 'right' | 'center';
  metaData: {
    howToConsume: string[];
    whenToConsume: string[];
  };
  mediaData: {
    mediaType: 'image' | 'video';
    mediaLink: IMediaUpload[];
  };
}

export interface IProjectFeatureSection {
  title: string;
  description: string;
  images: IMediaUpload[];
  feature: string[];
  tagLine: string;
}

export interface IProjectStarEndorsedSection {
  title: string;
  description: string;
  mediaData: {
    mediaType: 'image' | 'video';
    mediaLink: IMediaUpload[];
  };
}

export interface IProductAdditionalInfo {
  ingredients?: IProductIngredientSection;
  priceRange?: {
    min: number;
    max: number;
  };
  benefits?: string[];
  dose?: string;
  howToTake?: string;
  feature?: IProjectFeatureSection;
  precautions?: string[];
  consumptionInstructions?: IProjectConsumptionInstructionSection;
  report?: IProductReport;
  outcomes?: IOutcomeSection;
  startEndorsed?: IProjectStarEndorsedSection;
}

export interface IProductVariant {
  productVariantId: number;
  productId: number;
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
  id: number;
  productVariantId: number;
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
  isActive: boolean;
  /**
   * Validity period for this price
   */
  validFrom: Date | string | null;
  validTo: Date | string | null;
}

interface IBaseProduct {
  name: string;
  imagePath: IMediaUpload[];
  additionalInfo: IProductAdditionalInfo;
  hsnCode: string;
  /**
   * Flattened fee structure used by existing UI (quantity, unit, currency, price)
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

export interface IProduct extends IBaseProduct {
  productId: number;
  active: boolean;
  createdBy: number;
  modifiedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdIp: string;
  modifiedIp: string;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
  /**
   * Variant/price structure linked to the product
   */
  variants?: IProductVariant[];
}

