import { ICommonTable, IAdminInfo } from "../base.interface";

export interface IBaseSeoPage {
  url: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogType?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  twitterCard?: string;
  active: boolean;
}

export interface IManageSeoPage extends IBaseSeoPage {
  seoPageId?: number;
}

export interface ISeoPage extends IBaseSeoPage, ICommonTable, IAdminInfo {
  seoPageId: number;
}

export interface ISeoPageData {
  seoPageId: number;
  url: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogType?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  twitterCard?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateSeoPageDto {
  url: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogType?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  twitterCard?: string;
  active: boolean;
}

export interface IUpdateSeoPageDto extends ICreateSeoPageDto {
  seoPageId?: number;
}

