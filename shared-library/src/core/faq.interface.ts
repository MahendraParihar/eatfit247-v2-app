import { IBaseAdminUser, ICommonTable } from "../base.interface";

export interface IBaseFaq {
  faq: string;
  answer: string;
  faqCategoryId: number;
}

export interface IManageFaq extends IBaseFaq {
  faqId?: number;
  active: boolean;
}

export interface IFaq extends IBaseFaq {
  faqId: number;
  faqCategory: string;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface IBaseFaqCategory {
  faqCategory: string;
  url?: string;
}

export interface IManageFaqCategory extends IBaseFaqCategory {
  faqCategoryId?: number;
  active: boolean;
}

export interface IFaqCategory extends IBaseFaqCategory {
  faqCategoryId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

