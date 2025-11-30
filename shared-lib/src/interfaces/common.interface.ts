import { IAdminShortInfo } from "./admin-user.interface";
import { IMediaUpload } from "./media-upload.interface";

/**
 * Common Interfaces
 * Used across all EatFit247 applications
 */
/**
 * Base interface for entities with common audit fields
 * Extend this interface for entities that have active status and audit trail
 */
export interface ICreateUpdate {
  active?: boolean;
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
}

export interface IDropdownItem {
  id: number | string;
  label: string;
  isActive?: boolean;
  metadata?: any;
  selected?: boolean;
  parentId?: number;
}

export interface MultiTextDropdownListInterface {
  id: number;
  name: string;
  imagePath?: IMediaUpload[];
  subText: string;
  selected: boolean;
  parentId?: number;
}

export interface IBreadcrumbItem {
  label: string;
  url?: string;
  isActive?: boolean;
}

export interface INavItem {
  label: string;
  url: string;
  icon?: string;
  children?: INavItem[];
  isActive?: boolean;
  permissions?: string[];
}

export interface IFileModel {
  fileName: string;
  filePath: string;
  fileSize?: number;
  fileType?: string;
  buffer?: string;
}

export interface ITableColumn {
  name: string;
  dataKey: string;
  isSortable?: boolean;
  isFilterable?: boolean;
  width?: string;
}

export class IPaging {
  pageNumber: number = 0;
  pageSize: number = 15;
}

export interface IBasicSearch extends IPaging {
  name?: string | null;
  createdFrom?: Date | null;
  createdTo?: Date | null;
  active?: boolean | null;
}

export interface IRecipeSearch extends IBasicSearch {
  recipeCuisineIds?: number[];
  recipeTypeId?: number[];
  recipeCategoryIds?: number[];
}