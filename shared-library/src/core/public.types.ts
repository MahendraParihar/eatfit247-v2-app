/**
 * Public Types for Website
 * 
 * These types are used for public-facing data that excludes internal/admin fields
 * such as createdBy, updatedBy, modifiedBy, createdAt, updatedAt, createdIp, updatedIp, modifiedIp, active flags, etc.
 */

import { IBlog } from './blog.interface';
import { IBanner } from './banner.interface';
import { IPressMedia } from './press-media.interface';
import { IProgram } from './program.interface';
import { IFaq, IFaqCategory } from './faq.interface';
import { ITableList } from './table-list.interface';

/**
 * Utility type to exclude user/admin-specific fields from any type
 * Use this to create public versions of internal data models
 */
export type PublicData<T> = Omit<
  T,
  | 'createdBy'
  | 'updatedBy'
  | 'modifiedBy'
  | 'createdAt'
  | 'updatedAt'
  | 'createdIp'
  | 'updatedIp'
  | 'modifiedIp'
  | 'active'
  | 'createdByUser'
  | 'updatedByUser'
>;

/**
 * Public Blog Interface
 * Excludes: createdBy, updatedBy, modifiedBy, createdAt, updatedAt, createdIp, updatedIp, modifiedIp, active, createdByUser, updatedByUser
 */
export type IPublicBlog = PublicData<IBlog>;

/**
 * Public Banner Interface
 * Excludes: createdBy, updatedBy, modifiedBy, createdAt, updatedAt, createdIp, updatedIp, modifiedIp, active, createdByUser, updatedByUser
 */
export type IPublicBanner = PublicData<IBanner>;

/**
 * Public Press Media Interface
 * Excludes: createdBy, updatedBy, modifiedBy, createdAt, updatedAt, createdIp, updatedIp, modifiedIp, active, createdByUser, updatedByUser
 */
export type IPublicPressMedia = PublicData<IPressMedia>;

/**
 * Public Program Interface
 * Excludes: createdBy, updatedBy, modifiedBy, createdAt, updatedAt, createdIp, updatedIp, modifiedIp, active, createdByUser, updatedByUser
 */
export type IPublicProgram = PublicData<IProgram>;

/**
 * Public FAQ Interface
 * Excludes: createdBy, updatedBy, modifiedBy, createdAt, updatedAt, createdIp, updatedIp, modifiedIp, active, createdByUser, updatedByUser
 */
export type IPublicFaq = PublicData<IFaq>;

/**
 * Public FAQ Category Interface
 * Excludes: createdBy, updatedBy, modifiedBy, createdAt, updatedAt, createdIp, updatedIp, modifiedIp, active, createdByUser, updatedByUser
 */
export type IPublicFaqCategory = PublicData<IFaqCategory>;

/**
 * Generic table list response for public APIs
 */
export interface IPublicTableList<T> extends Omit<ITableList<T>, 'tableData'> {
  tableData: T[];
}

