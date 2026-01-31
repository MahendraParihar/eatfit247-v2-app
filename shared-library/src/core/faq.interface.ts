import { IBaseAdminUser, ICommonTable, IAdminInfo } from "../base.interface";

export interface IBaseFaq {
  faq: string;
  answer: string;
  faqCategoryId: number;
}

export interface IManageFaq extends IBaseFaq {
  faqId?: number;
  active: boolean;
}

export interface IFaq extends IBaseFaq, IAdminInfo {
  faqId: number;
  faqCategory: string;
  active: boolean;
}

export interface IBaseFaqCategory {
  faqCategory: string;
  url?: string;
}

export interface IManageFaqCategory extends IBaseFaqCategory {
  faqCategoryId?: number;
  active: boolean;
}

export interface IFaqCategory extends IBaseFaqCategory, IAdminInfo {
  faqCategoryId: number;
  active: boolean;
}

