/**
 * Common Interfaces
 * Used across all EatFit247 applications
 */
export interface IDropdownItem {
  value: any;
  label: string;
  isActive?: boolean;
  metadata?: any;
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

export interface IPaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
}

