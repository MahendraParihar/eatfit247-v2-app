import { TemplateRef } from '@angular/core';

export interface ITableHeader<T = any> {
  label: string;
  template?: TemplateRef<any>;
  tooltip?: string;
  className?: string;
  showSortIndicator?: boolean;
  renderer?: (column: ITableColumn<T>) => string;
}

export interface ITableActionButton<T = any> {
  label: string;
  icon?: string;
  color?: 'primary' | 'accent' | 'warn' | '';
  tooltip?: string;
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  onClick: (row: T, event?: Event) => void | Promise<void>;
  confirm?: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  };
  badge?: (row: T) => number | string;
  className?: string;
  asMenuItem?: boolean;
}

export interface ITableActionsConfig {
  headerLabel?: string;
  headerTemplate?: TemplateRef<any>;
  align?: 'left' | 'center' | 'right';
  width?: string;
  asMenu?: boolean;
  menuTriggerIcon?: string;
  className?: string;
}

export interface ITableColumn<T> {
  key: string;
  label?: string;
  header?: ITableHeader<T>;
  dataKey?: string;
  type?: 'image' | 'text' | 'number' | 'date' | 'boolean' | 'custom';
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
  searchable?: boolean;
  cellTemplate?: TemplateRef<any>;
  headerTemplate?: TemplateRef<any>;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
  stickyEnd?: boolean;
  formatter?: (value: any, row: T) => string;
  hidden?: boolean;
  isAvatar?: boolean;
  imageAlt?: string;
  mediaPath?: string;
}

export interface ITableAction<T = any> {
  label: string;
  icon?: string;
  color?: 'primary' | 'accent' | 'warn' | '';
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  onClick: (row: T) => void;
}

export interface ITableConfig<T = any> {
  columns: ITableColumn<T>[];
  actions?: ITableAction<T>[];
  actionsConfig?: {
    buttons?: ITableActionButton<T>[];
    column?: ITableActionsConfig;
  };
  selectable?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  showPagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  loading?: boolean;
  emptyMessage?: string;
  emptyTemplate?: TemplateRef<any>;
  showHeader?: boolean;
  onRowClick?: (row: T) => void;
  rowClass?: (row: T) => string | string[];
}

export interface ITablePagination {
  pageIndex: number;
  pageSize: number;
  length: number;
}

export interface ITableSort {
  active: string;
  direction: 'asc' | 'desc' | '';
}

