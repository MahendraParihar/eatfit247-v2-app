import { IBaseAdminUser } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IProductSize {
  value: string;
  label: string;
  price: number;
}

export interface IProductIngredient {
  name: string;
  icon?: string;
  description?: string;
}

export interface IProductBenefit {
  title: string;
  description: string;
  icon?: string;
}

export interface IProductConsumptionTiming {
  morning: string;
  evening: string;
}

export interface IProductConsumptionInstructions {
  amount: string;
  methods: string[];
  timing: IProductConsumptionTiming;
}

export interface IProductFAQ {
  question: string;
  answer: string;
}

export interface IBaseProduct {
  name: string;
  slug: string;
  description?: string;
  priceRange: {
    min: number;
    max: number;
  };
  sizes: IProductSize[];
  benefits: string[];
  dose: string;
  howToTake: string;
  precautions: string[];
  ingredients: IProductIngredient[];
  consumptionInstructions: IProductConsumptionInstructions;
  outcomes: IProductBenefit[];
  faqs: IProductFAQ[];
  images?: IMediaUpload[];
  videos?: string[];
}

export interface IManageProduct extends IBaseProduct {
  productId?: number;
  active: boolean;
}

export interface IProduct extends IBaseProduct {
  productId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

