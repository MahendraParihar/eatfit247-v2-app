import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ViewChild,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { ImgComponent } from '../img/img.component';
import {
  ITableColumn,
  ITableConfig,
  ITableAction,
  ITableActionButton,
  ITableActionsConfig,
  ITablePagination,
  ITableSort
} from './data-table.interface';

@Component({
  selector: 'shared-ui-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    ImgComponent
  ],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent<T = any> implements OnInit, OnChanges {
  @Input() config!: ITableConfig<T>;
  @Input() data: T[] = [];
  @Input() totalCount = 0;
  @Input() loading = false;
  @Output() pageChange = new EventEmitter<ITablePagination>();
  @Output() sortChange = new EventEmitter<ITableSort>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() selectionChange = new EventEmitter<T[]>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<T>([]);
  searchValue = '';
  selectedRows: Set<T> = new Set();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initializeTable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['config']) {
      this.initializeTable();
    }
    if (changes['loading']) {
      this.cdr.detectChanges();
    }
  }

  private initializeTable(): void {
    if (!this.config) return;
    // Build displayed columns
    this.displayedColumns = this.config.columns
      .filter((col) => !col.hidden)
      .map((col) => col.key);
    // Add a selection column if enabled
    if (this.config.selectable) {
      this.displayedColumns = ['select', ...this.displayedColumns];
    }
    // Add an actions column if actions exist
    const hasActions = (this.config.actions && this.config.actions.length > 0) ||
      (this.config.actionsConfig?.buttons && this.config.actionsConfig.buttons.length > 0);
    if (hasActions) {
      this.displayedColumns = [...this.displayedColumns, 'actions'];
    }
    // Update data source
    this.dataSource.data = this.data;
  }

  getCellValue(row: T, column: ITableColumn<T>): any {
    if (column.dataKey) {
      const keys = column.dataKey.split('.');
      let value: any = row;
      for (const key of keys) {
        value = value?.[key];
        if (value === undefined || value === null) break;
      }
      return value;
    }
    return (row as any)[column.key];
  }

  getFormattedValue(row: T, column: ITableColumn<T>): string | Date {
    const value = this.getCellValue(row, column);
    if (column.type === 'date') {
      return new Date(value);
    }
    if (column.formatter) {
      return column.formatter(value, row);
    }
    return value != null ? String(value) : '';
  }

  getHeaderLabel(column: ITableColumn<T>): string {
    if (column.header?.label) {
      return column.header.label;
    }
    if (column.label) {
      return column.label;
    }
    return column.key;
  }

  getHeaderTemplate(column: ITableColumn<T>): TemplateRef<any> | undefined {
    return column.header?.template || column.headerTemplate;
  }

  getHeaderTooltip(column: ITableColumn<T>): string | null {
    return column.header?.tooltip || null;
  }

  getHeaderClass(column: ITableColumn<T>): string {
    const classes: string[] = [];
    if (column.header?.className) {
      classes.push(column.header.className);
    }
    return classes.join(' ');
  }

  getActions(): (ITableAction<T> | ITableActionButton<T>)[] {
    if (this.config.actionsConfig?.buttons) {
      return this.config.actionsConfig.buttons;
    }
    if (this.config.actions) {
      return this.config.actions;
    }
    return [];
  }

  hasVisibleActions(row: T): boolean {
    const actions = this.getActions();
    return actions.some(action => this.isActionVisible(action, row));
  }

  getActionsConfig(): ITableActionsConfig | null {
    return this.config.actionsConfig?.column || null;
  }

  getActionsHeaderLabel(): string {
    const config = this.getActionsConfig();
    return config?.headerLabel || 'Actions';
  }

  getActionsHeaderTemplate(): TemplateRef<any> | undefined {
    const config = this.getActionsConfig();
    return config?.headerTemplate;
  }

  hasImageValue(row: T, column: ITableColumn<T>): boolean {
    const value = this.getCellValue(row, column);
    if (!value) return false;
    // If it's an array (IMediaUpload[]), check if it has items
    if (Array.isArray(value)) {
      return value.length > 0 && value[0]?.webUrl;
    }
    // If it's a string, check if it's not empty
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return true;
  }

  onPageChange(event: PageEvent): void {
    const pagination: ITablePagination = {
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
      length: this.totalCount
    };
    this.pageChange.emit(pagination);
  }

  onSortChange(sort: Sort): void {
    const tableSort: ITableSort = {
      active: sort.active,
      direction: sort.direction as 'asc' | 'desc' | ''
    };
    this.sortChange.emit(tableSort);
  }

  onSearchChange(value: string): void {
    this.searchValue = value;
    this.searchChange.emit(value);
  }

  onRowClickHandler(row: T): void {
    if (this.config.onRowClick) {
      this.config.onRowClick(row);
    }
    this.rowClick.emit(row);
  }

  onActionClick(action: ITableAction<T> | ITableActionButton<T>, row: T, event: Event): void {
    event.stopPropagation();
    // Check if it's the new TableActionButton interface
    if ('confirm' in action && action.confirm) {
      const confirmed = confirm(action.confirm.message);
      if (!confirmed) {
        return;
      }
    }
    if (this.isActionDisabled(action, row)) {
      return;
    }
    // Handle both old and new action interfaces
    if ('onClick' in action) {
      const result = action.onClick(row, event);
      // Handle async actions
      if (result instanceof Promise) {
        result.catch((error) => {
          console.error('Action error:', error);
        });
      }
    }
  }

  isActionVisible(action: ITableAction<T> | ITableActionButton<T>, row: T): boolean {
    if ('visible' in action && action.visible) {
      return action.visible(row);
    }
    return true;
  }

  isActionDisabled(action: ITableAction<T> | ITableActionButton<T>, row: T): boolean {
    if ('disabled' in action && action.disabled) {
      return action.disabled(row);
    }
    return false;
  }

  getActionTooltip(action: ITableAction<T> | ITableActionButton<T>, row: T): string {
    if ('tooltip' in action && action.tooltip) {
      return action.tooltip;
    }
    if ('label' in action) {
      return action.label;
    }
    return '';
  }

  getActionBadge(action: ITableActionButton<T>, row: T): number | string | null {
    if (action.badge) {
      return action.badge(row);
    }
    return null;
  }

  getRowClass(row: T): string | string[] {
    if (this.config.rowClass) {
      return this.config.rowClass(row);
    }
    return '';
  }

  // Selection methods
  toggleRowSelection(row: T): void {
    if (this.selectedRows.has(row)) {
      this.selectedRows.delete(row);
    } else {
      this.selectedRows.add(row);
    }
    this.emitSelection();
  }

  toggleAllSelection(): void {
    if (this.isAllSelected()) {
      this.selectedRows.clear();
    } else {
      this.data.forEach((row) => this.selectedRows.add(row));
    }
    this.emitSelection();
  }

  isRowSelected(row: T): boolean {
    return this.selectedRows.has(row);
  }

  isAllSelected(): boolean {
    return this.data.length > 0 && this.data.every((row) => this.selectedRows.has(row));
  }

  isIndeterminate(): boolean {
    return this.selectedRows.size > 0 && !this.isAllSelected();
  }

  private emitSelection(): void {
    this.selectionChange.emit(Array.from(this.selectedRows));
  }

  clearSelection(): void {
    this.selectedRows.clear();
    this.emitSelection();
  }

  getPageIndex(): number {
    return this.paginator?.pageIndex ?? 0;
  }

  hasHeaderContent(): boolean {
    // Show header if search is enabled
    // Note: If headerActions are used without search, set showSearch to true
    // and hide the search field with CSS, or add showTableHeader config option
    return this.config.showSearch !== false;
  }
}

