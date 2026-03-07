import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { IRecipe } from '@eatfit247-shared-lib';
import { RecipesApiService } from '../api.service';

@Component({
  selector: 'lib-view-recipe-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatCardModule,
    MatChipsModule,
  ],
  templateUrl: './view-recipe-dialog.component.html',
  styleUrl: './view-recipe-dialog.component.scss',
})
export class ViewRecipeDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<ViewRecipeDialogComponent>>(MatDialogRef);
  data = inject<IRecipe>(MAT_DIALOG_DATA);
  private apiService = inject(RecipesApiService);
  private snackBar = inject(MatSnackBar);

  recipe!: IRecipe;
  loading = false;

  constructor() {
    const data = this.data;

    this.recipe = data;
  }

  ngOnInit(): void {
    // Load full recipe details if needed
    if (this.recipe && this.recipe.recipeId) {
      this.loadRecipeDetails();
    }
  }

  async loadRecipeDetails(): Promise<void> {
    try {
      this.loading = true;
      this.recipe = await this.apiService.getById(this.recipe.recipeId);
    } catch (error) {
      this.snackBar.open('Failed to load recipe details', 'Close', {
        duration: 3000,
      });
    } finally {
      this.loading = false;
    }
  }

  onClose(): void {
    this.dialogRef.close(false);
  }

  async downloadRecipe(): Promise<void> {
    try {
      this.loading = true;
      const fileData = await this.apiService.downloadRecipePdf(
        this.recipe.recipeId,
      );
      if (fileData) {
        this.downloadFile(fileData.buffer, fileData.fileName);
        this.snackBar.open('Recipe PDF downloaded successfully', 'Close', {
          duration: 3000,
        });
      }
    } catch (error) {
      this.snackBar.open('Failed to download recipe PDF', 'Close', {
        duration: 3000,
      });
    } finally {
      this.loading = false;
    }
  }

  downloadFile(base64String: string, fileName: string): void {
    if (base64String) {
      const mediaType = 'data:application/pdf;base64,';
      const link = document.createElement('a');
      link.setAttribute('target', '_blank');
      link.setAttribute('href', mediaType + base64String);
      link.setAttribute('download', `${fileName}`);
      link.click();
      link.remove();
    }
  }

  getImageUrl(imagePath: any[]): string {
    if (imagePath && imagePath.length > 0 && imagePath[0].webUrl) {
      return imagePath[0].webUrl;
    }
    return '';
  }

  getCategories(): string {
    if (
      this.recipe.recipeCategoryMappings &&
      this.recipe.recipeCategoryMappings.length > 0
    ) {
      return this.recipe.recipeCategoryMappings
        .map((cat) => cat.recipeCategory)
        .join(', ');
    }
    if (
      (this.recipe as any).recipeCategoryList &&
      (this.recipe as any).recipeCategoryList.length > 0
    ) {
      return (this.recipe as any).recipeCategoryList
        .map((cat: any) => cat.recipeCategory || cat.name)
        .join(', ');
    }
    return 'N/A';
  }

  getCuisines(): string {
    if (
      this.recipe.recipeCuisineMappings &&
      this.recipe.recipeCuisineMappings.length > 0
    ) {
      return this.recipe.recipeCuisineMappings
        .map((cuisine) => cuisine.recipeCuisine)
        .join(', ');
    }
    if (
      (this.recipe as any).recipeCuisineList &&
      (this.recipe as any).recipeCuisineList.length > 0
    ) {
      return (this.recipe as any).recipeCuisineList
        .map((cuisine: any) => cuisine.recipeCuisine || cuisine.name)
        .join(', ');
    }
    return 'N/A';
  }

}

