/**
 * DataTableComponent - Shared Admin Table (NON-NEGOTIABLE)
 * 
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 * ⚠️ STORYBOOK IS PRIMARY SOURCE: http://localhost:4400
 * 
 * Rules (per design system):
 * - Must use shared table component (NON-NEGOTIABLE)
 * - Pagination always enabled
 * - Hover state required
 * - Actions right-aligned
 * - No custom tables allowed
 * - Uses design tokens for all colors
 * - Supports light/dark themes (class-based)
 * - Material 3 compliant
 * - Border radius: 16px (card style)
 * - Elevation: Level 1
 * 
 * Violation = PR rejection.
 */

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
  ChangeDetectorRef,
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
import { TableColumn, TableConfig, TableAction, TablePagination, TableSort } from './data-table.config';

@Component({
  selector: 'app-data-table',
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
  ],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent<T = any> implements OnInit, OnChanges {
  @Input() config!: TableConfig<T>;
  @Input() data: T[] = [];
  @Input() totalCount: number = 0;
  @Input() loading: boolean = false;

  @Output() pageChange = new EventEmitter<TablePagination>();
  @Output() sortChange = new EventEmitter<TableSort>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() selectionChange = new EventEmitter<T[]>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<T>([]);
  searchValue: string = '';
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

    // Add selection column if enabled
    if (this.config.selectable) {
      this.displayedColumns = ['select', ...this.displayedColumns];
    }

    // Add actions column if actions exist
    if (this.config.actions && this.config.actions.length > 0) {
      this.displayedColumns = [...this.displayedColumns, 'actions'];
    }

    // Update data source
    this.dataSource.data = this.data;
  }

  getCellValue(row: T, column: TableColumn<T>): any {
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

  getFormattedValue(row: T, column: TableColumn<T>): string {
    const value = this.getCellValue(row, column);
    if (column.formatter) {
      return column.formatter(value, row);
    }
    return value != null ? String(value) : '';
  }

  onPageChange(event: PageEvent): void {
    const pagination: TablePagination = {
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
      length: this.totalCount,
    };
    this.pageChange.emit(pagination);
  }

  onSortChange(sort: Sort): void {
    const tableSort: TableSort = {
      active: sort.active,
      direction: sort.direction as 'asc' | 'desc' | '',
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

  onActionClick(action: TableAction<T>, row: T, event: Event): void {
    event.stopPropagation();
    if (!action.disabled || !action.disabled(row)) {
      action.onClick(row);
    }
  }

  isActionVisible(action: TableAction<T>, row: T): boolean {
    return !action.visible || action.visible(row);
  }

  isActionDisabled(action: TableAction<T>, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
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
}

