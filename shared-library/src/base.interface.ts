export interface IBaseAdminUser {
  firstName: string;
  lastName: string;
}

export interface ISocialLink {
  label: string;
  link: string;
  icon: string;
}

export interface ICommonTable {
  active: boolean;
  createdBy: number;
  createdAt: Date;
  modifiedBy: number;
  updatedAt: Date;
}

export interface ICommonSEO {
  url?: string;
}

export interface IDropdownItem {
  id: number | string;
  label: string;
  isActive?: boolean;
  metadata?: any;
  selected?: boolean;
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

export interface IAdminInfo {
  createdBy: number;
  modifiedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}