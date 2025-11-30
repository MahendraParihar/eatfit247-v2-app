import { ICommonSEO } from '../base.interface';

export interface ITableList<T> extends ICommonSEO {
  data: T[];
  count: number;
}

export interface ITableListFilter {
  page: number;
  limit: number;
  search?: string;
  ids?: number[];
}

export interface IBasicSearch extends ITableListFilter {
  name?: string | null;
  createdFrom?: Date | null;
  createdTo?: Date | null;
  active?: boolean | null;
}