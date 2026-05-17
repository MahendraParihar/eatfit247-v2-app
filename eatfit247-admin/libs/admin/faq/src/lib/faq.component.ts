import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { IFaq } from '@eatfit247-shared-lib';
import { FaqApiService } from './api.service';

@Component({
  selector: 'lib-faq',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
})
export class Faq extends BaseListComponent<IFaq> {
  protected apiService = inject(FaqApiService);
  private snackBar = inject(MatSnackBar);

  protected listConfig = {
    editRoute: '/faq/edit',
    createRoute: '/faq/new',
    searchPlaceholder: 'Search FAQ...',
    emptyMessage: 'No FAQ records found',
  };

  protected buildEntityColumns(): ITableColumn<IFaq>[] {
    return [
      { key: 'faqId', label: 'ID', dataKey: 'faqId', sortable: true, width: '80px' },
      { key: 'faq', label: 'Question', dataKey: 'faq', sortable: true, searchable: true },
      { key: 'faqCategory', label: 'Category', dataKey: 'faqCategory', sortable: false },
    ];
  }

  protected override buildExtraActions(): ITableAction<IFaq>[] {
    return [
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
    ];
  }

  protected getItemId(item: IFaq): number { return item.faqId; }
  protected getItemDisplayName(item: IFaq): string { return item.faq; }

  viewItem(item: IFaq): void {
    // View functionality can be implemented here if needed
  }

  override async toggleStatus(item: IFaq): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} this FAQ?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.faqId, !item.active);
        this.snackBar.open(
          `FAQ ${item.active ? 'deactivated' : 'activated'} successfully`,
          'Close',
          { duration: 3000 }
        );
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}
