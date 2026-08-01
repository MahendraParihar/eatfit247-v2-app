import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { IRecipe } from '@eatfit247-shared-lib';
import { RecipesApiService } from './api.service';
import { ViewRecipeDialogComponent } from './view-recipe-dialog/view-recipe-dialog.component';

@Component({
  selector: 'lib-recipes',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './recipes.html',
  styleUrl: './recipes.scss'
})
export class Recipes extends BaseListComponent<IRecipe> {
  protected apiService = inject(RecipesApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  protected listConfig = {
    editRoute: '/recipes/edit',
    createRoute: '/recipes/new',
    searchPlaceholder: 'Search recipes...',
    emptyMessage: 'No recipes found',
  };

  protected buildEntityColumns(): ITableColumn<IRecipe>[] {
    return [
      { key: 'recipeId', label: 'ID', dataKey: 'recipeId', sortable: true, width: '80px' },
      {
        key: 'image',
        label: 'Image',
        isAvatar: true,
        dataKey: 'imagePath',
        sortable: false,
        type: 'image',
      },
      { key: 'name', label: 'Recipe Name', dataKey: 'name', sortable: true, searchable: true },
      {
        key: 'recipeType',
        label: 'Type',
        dataKey: 'recipeType',
        sortable: false,
        formatter: (value) => value || '-',
      },
    ];
  }

  protected override buildExtraActions(): ITableAction<IRecipe>[] {
    return [
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
      { label: 'Download PDF', icon: 'download', color: 'primary', onClick: (row) => this.downloadPdf(row) },
    ];
  }

  protected getItemId(item: IRecipe): number { return item.recipeId; }
  protected getItemDisplayName(item: IRecipe): string { return item.name; }

  viewItem(item: IRecipe): void {
    const dialogRef = this.dialog.open(ViewRecipeDialogComponent, {
      width: '900px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: item,
      closeOnNavigation: false,
      disableClose: false,
    });
    dialogRef.afterClosed().subscribe((result) => {
      // Handle dialog close if needed
    });
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
    } catch (error) {
      console.error('Error downloading PDF:', error);
      this.snackBar.open('Failed to download recipe PDF. Please try again.', 'Close', {
        duration: 5000,
      });
    } finally {
      this.loading = false;
    }
  }
}
