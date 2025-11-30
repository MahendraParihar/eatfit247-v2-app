export interface ICommonSEO {
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  url?: string;
}

export interface ITableList<T> extends ICommonSEO {
  data: T[];
  count: number;
}

export interface ITableListFilter {
  page: number;
  limit: number;
  search?: string;
  name?: string;
  active?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
  ids?: number[];
}