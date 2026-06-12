import { ICommonSEO } from '../base.interface';

export interface ITableList<T> extends ICommonSEO {
  tableData: T[];
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
  showOnWebsite?: boolean | null;
  includeAdminRoles?: boolean;
  /** Declared for list endpoints; each module applies its own allowlist. */
  sortField?: string;
  sortDirection?: string;
  /** Query alias for `sortField` (admin UI / data table). */
  sortBy?: string;
  /** Query alias for `sortDirection` (admin UI / data table). */
  sortOrder?: string;
  programId?: number;
  isSpecialProgram?: boolean | null;
}

export interface IRecipeSearch extends IBasicSearch {
  recipeCuisineIds?: number[];
  recipeTypeId?: number[];
  recipeCategoryIds?: number[];
}