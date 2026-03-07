import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import {
  createdByUserFormatter,
  DataTableComponent,
  ITableAction,
  ITableColumn,
  ITableConfig,
  updatedByUserFormatter
} from '@shared';
import { IRecipe, ITableList } from '@eatfit247-shared-lib';
import { RecipesApiService } from './api.service';
import { ViewRecipeDialogComponent } from './view-recipe-dialog/view-recipe-dialog.component';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-recipes',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './recipes.html',
  styleUrl: './recipes.scss'
})
export class Recipes implements OnInit {
  private apiService = inject(RecipesApiService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  data: IRecipe[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IRecipe>;
  private searchSubject = new Subject<string>();
  currentSearch = '';

  constructor() {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  private initializeTable(): void {
    const columns: ITableColumn<IRecipe>[] = [
      {
        key: 'recipeId',
        label: 'ID',
        dataKey: 'recipeId',
        sortable: true,
        width: '80px'
      },
      {
        key: 'image',
        label: 'Image',
        isAvatar: true,
        dataKey: 'imagePath',
        sortable: false,
        type: 'image'
      },
      {
        key: 'name',
        label: 'Recipe Name',
        dataKey: 'name',
        sortable: true,
        searchable: true
      },
      {
        key: 'recipeType',
        label: 'Type',
        dataKey: 'recipeType',
        sortable: false,
        formatter: (value) => value || '-'
      },
      {
        key: 'active',
        label: 'Status',
        dataKey: 'active',
        sortable: true,
        width: '120px',
        align: 'center',
        formatter: (value) => (value ? 'Active' : 'Inactive')
      },
      {
        key: 'createdByUser',
        label: 'Created By',
        dataKey: 'createdByUser',
        sortable: false,
        formatter: createdByUserFormatter()
      },
      {
        key: 'updatedByUser',
        label: 'Updated By',
        dataKey: 'updatedByUser',
        sortable: false,
        formatter: updatedByUserFormatter()
      },
      {
        key: 'createdAt',
        label: 'Created At',
        dataKey: 'createdAt',
        type: 'date',
        sortable: true
      },
      {
        key: 'updatedAt',
        label: 'Updated At',
        dataKey: 'updatedAt',
        type: 'date',
        sortable: true
      }
    ];
    const actions: ITableAction<IRecipe>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
      { label: 'Download PDF', icon: 'download', color: 'primary', onClick: (row) => this.downloadPdf(row) },
      {
        label: 'Active',
        icon: 'check_circle',
        color: 'primary',
        visible: (row) => row.active,
        onClick: (row) => this.toggleStatus(row)
      },
      {
        label: 'Inactive',
        icon: 'cancel',
        color: 'warn',
        visible: (row) => !row.active,
        onClick: (row) => this.toggleStatus(row)
      }
    ];
    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search recipes...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No recipes found'
    };
  }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), switchMap((search) => {
      this.loading = true;
      return this.apiService.getList({ search, page: 0, limit: this.tableConfig.pageSize || 10 });
    })).subscribe({
      next: (response) => {
        this.data = response.tableData;
        this.totalCount = response.count;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<IRecipe> = await this.apiService.getList({
        page: 0,
        limit: this.tableConfig.pageSize || 10,
        search: this.currentSearch?.trim() || undefined
      });
      this.data = response.tableData;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  async onPageChange(pagination: any): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<IRecipe> = await this.apiService.getList({
        page: pagination.pageIndex,
        limit: pagination.pageSize,
        search: this.currentSearch?.trim() || undefined
      });
      this.data = response.tableData;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  async onSortChange(sort: any): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<IRecipe> = await this.apiService.getList({
        page: 0,
        limit: this.tableConfig.pageSize || 10,
        sortBy: sort.active,
        sortOrder: sort.direction,
        search: this.currentSearch?.trim() || undefined
      });
      this.data = response.tableData;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  onSearchChange(search: string): void {
    this.currentSearch = search;
    this.searchSubject.next(search);
  }

  editItem(item: IRecipe): void {
    this.router.navigate(['/recipes/edit', item.recipeId]);
  }

  createItem(): void {
    this.router.navigate(['/recipes/new']);
  }

  viewItem(item: IRecipe): void {
    const dialogRef = this.dialog.open(ViewRecipeDialogComponent, {
      width: '900px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: item,
      closeOnNavigation: false,
      disableClose: false
    });
    dialogRef.afterClosed().subscribe((result) => {
      // Handle dialog close if needed
    });
  }

  async toggleStatus(item: IRecipe): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.name}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.recipeId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }

  async downloadPdf(item: IRecipe): Promise<void> {
    this.loading = true;
    try {
      const response = await this.apiService.downloadRecipePdf(item.recipeId);
      // Convert base64 buffer to blob and download
      const byteCharacters = atob(response.buffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.fileName || `${item.name.replace(/[^\w\s]/gi, '').replace(/ /g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      this.loading = false;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download recipe PDF. Please try again.');
      this.loading = false;
    }
  }
}
