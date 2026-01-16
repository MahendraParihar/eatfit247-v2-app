import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Editor, NgxEditorComponent, NgxEditorMenuComponent } from 'ngx-editor';
import { InputErrorComponent, SeoFormComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { RecipesApiService } from 'recipes';
import { FileTypeEnum, IDropdownItem, InputLengthEnum, IRecipe, MediaForEnum } from '@eatfit247-shared-lib';

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
    FormsModule,
    NgxEditorComponent,
    NgxEditorMenuComponent,
    InputErrorComponent,
    UploadFormComponent,
    SeoFormComponent
  ],
  templateUrl: './manage-recipe.html',
  styleUrl: './manage-recipe.scss'
})
export class ManageRecipe implements OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(InputLengthEnum.CHAR_2),
        Validators.maxLength(255)
      ]
    ],
    recipeTypeId: ['', [Validators.required]],
    recipeCategoryIds: [[], [Validators.required]],
    recipeCuisineIds: [[], [Validators.required]],
    details: [''],
    preparationMethod: [''],
    ingredient: [''],
    howToMake: [''],
    benefits: [''],
    servingCount: [1, [Validators.required, Validators.min(1)]],
    isVisibleToAll: [false, [Validators.required]],
    active: [true, [Validators.required]]
  });
  initialData!: IRecipe;
  isEditMode = false;
  pageTitle = 'Create Recipe';
  recipeTypeOptions: IDropdownItem[] = [];
  recipeCategoryOptions: IDropdownItem[] = [];
  recipeCuisineOptions: IDropdownItem[] = [];
  mediaFor = MediaForEnum.RECIPE;
  mediaType = FileTypeEnum.IMAGE;
  fileTypePDF = FileTypeEnum.PDF; // For template reference
  editor: Editor | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: RecipesApiService
  ) {}

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
    if (!this.editor) {
      this.editor = new Editor();
    }
  }


  private patchFormValues(): void {
    if (this.initialData) {
      // Handle recipe categories - extract IDs from the list
      const categoryIds =
        this.initialData.recipeCategoryMappings?.map(
          (cat) => cat.recipeCategoryId,
        ) || [];
      
      // Handle recipe cuisines - extract IDs from the list
      const cuisineIds =
        this.initialData.recipeCuisineMappings?.map(
          (cuisine) => cuisine.recipeCuisineId,
        ) || [];
      
      this.formGroup.patchValue({
        name: this.initialData.name,
        recipeTypeId: this.initialData.recipeTypeId || '',
        recipeCategoryIds: categoryIds,
        recipeCuisineIds: cuisineIds,
        details: this.initialData.details || '',
        preparationMethod: this.initialData.preparationMethod || '',
        ingredient: this.initialData.ingredient || '',
        howToMake: (this.initialData as any).howToMake || '',
        benefits: this.initialData.benefits || '',
        servingCount: this.initialData.servingCount || 1,
        isVisibleToAll:
          this.initialData.isVisibleToAll !== undefined
            ? this.initialData.isVisibleToAll
            : false,
        tags: this.initialData.tags || [],
        active:
          this.initialData.active !== undefined
            ? this.initialData.active
            : true
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
      console.error('Error loading master data:', error);
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch (error) {
      console.error('Error loading recipe:', error);
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
      name: 255
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
      alert('Please select at least one recipe category');
      return;
    }
    
    // Validate that at least one cuisine is selected
    const cuisineIds = this.formGroup.get('recipeCuisineIds')?.value || [];
    if (!Array.isArray(cuisineIds) || cuisineIds.length === 0) {
      alert('Please select at least one recipe cuisine');
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
      const seoControl = this.formGroup.get('seo');
      if (seoControl && seoControl.value) {
        const seoValue = seoControl.value;
        formValue.seo = seoValue;
        formValue.seo.tags = seoValue.tags
          ? typeof seoValue.tags === 'string'
            ? seoValue.tags.split(', ').filter((t: string) => t.trim())
            : seoValue.tags
          : undefined;
      }
      if (this.isEditMode && this.initialData) {
        const recipeId = (this.initialData as any).recipeId;
        await this.apiService.update(recipeId, formValue);
      } else {
        await this.apiService.create(formValue);
      }
      this.router.navigate(['/recipes']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/recipes']);
  }

  ngOnDestroy(): void {
    if (this.editor) {
      try {
        this.editor.destroy();
      } catch (error) {
        console.warn('Error destroying editor:', error);
      }
      this.editor = null as any;
    }
  }
}
