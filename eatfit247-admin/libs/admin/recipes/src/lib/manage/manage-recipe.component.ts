import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Editor, NgxEditorComponent, NgxEditorMenuComponent } from 'ngx-editor';
import {
  InputErrorComponent,
  UploadFormComponent,
  ValidationUtil,
} from '@shared';
import { RecipesApiService } from 'recipes';
import {
  FileTypeEnum,
  IDropdownItem,
  InputLengthEnum,
  IRecipe,
  MediaForEnum,
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-recipe',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCardModule,
    MatCheckboxModule,
    MatSnackBarModule,
    FormsModule,
    NgxEditorComponent,
    NgxEditorMenuComponent,
    InputErrorComponent,
    UploadFormComponent,
  ],
  templateUrl: './manage-recipe.html',
  styleUrl: './manage-recipe.scss',
})
export class ManageRecipe implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(RecipesApiService);
  private snackBar = inject(MatSnackBar);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(InputLengthEnum.CHAR_2),
        Validators.maxLength(255),
      ],
    ],
    recipeTypeId: ['', [Validators.required]],
    recipeCategoryIds: [[], [Validators.required]],
    recipeCuisineIds: [[], [Validators.required]],
    details: [''],
    howToMake: [''],
    ingredient: [''],
    benefits: [''],
    servingCount: [1, [Validators.required, Validators.min(1)]],
    isVisibleToAll: [false, [Validators.required]],
    active: [true, [Validators.required]],
  });
  initialData!: IRecipe;
  isEditMode = false;
  pageTitle = 'Create Recipe';
  recipeTypeOptions: IDropdownItem[] = [];
  recipeCategoryOptions: IDropdownItem[] = [];
  recipeCuisineOptions: IDropdownItem[] = [];
  mediaFor = MediaForEnum.RECIPE;
  mediaType = FileTypeEnum.IMAGE;
  detailsEditor: Editor | null = null;
  howToMakeEditor: Editor | null = null;
  ingredientEditor: Editor | null = null;
  benefitsEditor: Editor | null = null;

  async ngOnInit(): Promise<void> {
    this.initializeEditor();
    const id = this.route.snapshot.paramMap.get('id');
    await this.loadMasterData();
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Recipe';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Recipe';
    }
    this.patchFormValues();
  }

  private initializeEditor(): void {
    // Create a separate Editor instance for each rich text field.
    if (!this.detailsEditor) {
      this.detailsEditor = new Editor();
    }
    if (!this.howToMakeEditor) {
      this.howToMakeEditor = new Editor();
    }
    if (!this.ingredientEditor) {
      this.ingredientEditor = new Editor();
    }
    if (!this.benefitsEditor) {
      this.benefitsEditor = new Editor();
    }
  }

  private patchFormValues(): void {
    if (this.initialData) {
      // Handle recipe categories - extract IDs from the list
      const categoryIds =
        this.initialData.recipeCategoryMappings?.map(
          (cat) => cat.recipeCategoryId
        ) || [];
      // Handle recipe cuisines - extract IDs from the list
      const cuisineIds =
        this.initialData.recipeCuisineMappings?.map(
          (cuisine) => cuisine.recipeCuisineId
        ) || [];
      this.formGroup.patchValue({
        name: this.initialData.name,
        recipeTypeId: this.initialData.recipeTypeId || '',
        recipeCategoryIds: categoryIds,
        recipeCuisineIds: cuisineIds,
        details: this.initialData.details || '',
        howToMake: this.initialData.howToMake || '',
        ingredient: this.initialData.ingredient || '',
        benefits: this.initialData.benefits || '',
        servingCount: this.initialData.servingCount || 1,
        isVisibleToAll:
          this.initialData.isVisibleToAll !== undefined
            ? this.initialData.isVisibleToAll
            : false,
        active:
          this.initialData.active !== undefined
            ? this.initialData.active
            : true,
      });
    }
  }

  async loadMasterData(): Promise<void> {
    try {
      const masterData = await this.apiService.getMasterData();
      this.recipeTypeOptions = masterData.recipeType || [];
      this.recipeCategoryOptions = masterData.recipeCategory || [];
      this.recipeCuisineOptions = masterData.recipeCuisine || [];
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch (error) {
      this.snackBar.open('Failed to load recipe. Please try again.', 'Close', {
        duration: 5000,
      });
      this.router.navigate(['/recipes']);
    }
  }

  getImagePathList(): any[] {
    if (!this.initialData || !this.initialData.imagePath) {
      return [];
    }
    return Array.isArray(this.initialData.imagePath)
      ? this.initialData.imagePath
      : [];
  }

  getMaxLength(controlName: string): number | null {
    const maxLengthMap: { [key: string]: number } = {
      name: 255,
    };
    return maxLengthMap[controlName] || null;
  }

  getCurrentLength(controlName: string): number {
    const control = this.formGroup.get(controlName);
    return control?.value?.length || 0;
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    // Validate that at least one category is selected
    const categoryIds = this.formGroup.get('recipeCategoryIds')?.value || [];
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      this.snackBar.open(
        'Please select at least one recipe category',
        'Close',
        {
          duration: 3000,
        }
      );
      return;
    }
    // Validate that at least one cuisine is selected
    const cuisineIds = this.formGroup.get('recipeCuisineIds')?.value || [];
    if (!Array.isArray(cuisineIds) || cuisineIds.length === 0) {
      this.snackBar.open('Please select at least one recipe cuisine', 'Close', {
        duration: 3000,
      });
      return;
    }
    if (this.formGroup.valid) {
      const formValue: any = { ...this.formGroup.value };
      // recipeCategoryIds and recipeCuisineIds are already arrays from the multiselect
      // Handle imagePath from upload form
      const imagePathControl = this.formGroup.get('imagePath');
      if (imagePathControl) {
        const imagePathValue = imagePathControl.value;
        if (Array.isArray(imagePathValue) && imagePathValue.length > 0) {
          formValue.imagePath = imagePathValue;
        } else {
          formValue.imagePath = [];
        }
      } else {
        formValue.imagePath = [];
      }
      // Handle downloadPath from upload form (if exists)
      const downloadPathControl = this.formGroup.get('downloadPath');
      if (downloadPathControl) {
        const downloadPathValue = downloadPathControl.value;
        if (Array.isArray(downloadPathValue) && downloadPathValue.length > 0) {
          formValue.downloadPath = downloadPathValue;
        } else {
          formValue.downloadPath = undefined;
        }
      }
      try {
        if (this.isEditMode && this.initialData) {
          const recipeId = this.initialData.recipeId;
          await this.apiService.update(recipeId, formValue);
          this.snackBar.open('Recipe updated successfully', 'Close', {
            duration: 3000,
          });
        } else {
          await this.apiService.create(formValue);
          this.snackBar.open('Recipe created successfully', 'Close', {
            duration: 3000,
          });
        }
        this.router.navigate(['/recipes']);
      } catch (error) {
        // Error toast is handled by HttpErrorInterceptor
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/recipes']);
  }

  ngOnDestroy(): void {
    const editors: (Editor | null)[] = [
      this.detailsEditor,
      this.howToMakeEditor,
      this.ingredientEditor,
      this.benefitsEditor,
    ];

    editors.forEach((ed, index) => {
      if (ed) {
        try {
          ed.destroy();
        } catch {
          // Ignore destroy errors for individual editors
        }
      }
    });

    this.detailsEditor = null;
    this.howToMakeEditor = null;
    this.ingredientEditor = null;
    this.benefitsEditor = null;
  }
}
