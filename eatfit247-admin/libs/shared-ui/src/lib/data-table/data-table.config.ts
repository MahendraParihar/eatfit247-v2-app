import { TemplateRef } from '@angular/core';

export interface TableColumn<T = any> {
  /** Unique identifier for the column */
  key: string;
  /** Display label for the column header */
  label: string;
  /** Property path to access data (supports nested paths like 'user.name') */
  dataKey?: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom sort function */
  sortFn?: (a: T, b: T) => number;
  /** Whether column is searchable */
  searchable?: boolean;
  /** Custom cell template */
  cellTemplate?: TemplateRef<any>;
  /** Custom header template */
  headerTemplate?: TemplateRef<any>;
  /** Column width (CSS value) */
  width?: string;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether column is sticky */
  sticky?: boolean;
  /** Sticky position */
  stickyEnd?: boolean;
  /** Custom formatter function */
  formatter?: (value: any, row: T) => string;
  /** Whether to hide column */
  hidden?: boolean;
}

export interface TableAction<T = any> {
  /** Action label */
  label: string;
  /** Action icon (Material icon name) */
  icon?: string;
  /** Action color */
  color?: 'primary' | 'accent' | 'warn' | '';
  /** Whether action is visible (function receives row data) */
  visible?: (row: T) => boolean;
  /** Whether action is disabled (function receives row data) */
  disabled?: (row: T) => boolean;
  /** Action click handler */
  onClick: (row: T) => void;
}

export interface TableConfig<T = any> {
  /** Table columns configuration */
  columns: TableColumn<T>[];
  /** Row actions */
  actions?: TableAction<T>[];
  /** Whether to show row selection checkbox */
  selectable?: boolean;
  /** Whether to show search */
  showSearch?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Whether to show pagination */
  showPagination?: boolean;
  /** Default page size */
  pageSize?: number;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Whether to show loading indicator */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom empty state template */
  emptyTemplate?: TemplateRef<any>;
  /** Whether to show header */
  showHeader?: boolean;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Custom row class */
  rowClass?: (row: T) => string | string[];
}

export interface TablePagination {
  pageIndex: number;
  pageSize: number;
  length: number;
}

export interface TableSort {
  active: string;
  direction: 'asc' | 'desc' | '';
}

