import { IBaseAdminUser } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IProductFee {
  price: number;
  currency: string;
  quantity: number;
  unit: string;
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

interface IBaseProduct {
  name: string;
  imagePath: IMediaUpload[];
  fees: IProductFee[];
  additionalInfo: IProductAdditionalInfo;
}

export interface IManageProduct extends IBaseProduct {
  productId?: number;
  active: boolean;
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
}

