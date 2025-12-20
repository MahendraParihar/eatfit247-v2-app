import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { LovMasterApiService } from '../../api.service';
import { FileTypeEnum, IRecipeCategory, IManageRecipeCategory, InputLengthEnum, MediaForEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-recipe-category',
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
    InputErrorComponent,
    UploadFormComponent
  ],
  templateUrl: './manage-recipe-category.html',
  styleUrl: './manage-recipe-category.scss'
})
export class ManageRecipeCategory implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    recipeCategory: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_50)]],
    fromTime: ['', [Validators.required]],
    toTime: ['', [Validators.required]],
    sequence: [0, [Validators.required, Validators.min(0)]],
    active: [true, [Validators.required]]
  });
  initialData!: IRecipeCategory;
  mediaFor = MediaForEnum.RECIPE_CATEGORY;
  mediaType = FileTypeEnum.IMAGE;
  isEditMode = false;
  pageTitle = 'Create Recipe Category';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: LovMasterApiService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Recipe Category';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Recipe Category';
    }
    this.buildForm();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      recipeCategory: [
        this.initialData?.recipeCategory || '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.CHAR_2),
          Validators.maxLength(InputLengthEnum.CHAR_50)
        ]
      ],
      fromTime: [this.initialData?.fromTime || '', [Validators.required]],
      toTime: [this.initialData?.toTime || '', [Validators.required]],
      sequence: [this.initialData?.sequence || 0, [Validators.required, Validators.min(0)]],
      active: [this.initialData?.active !== undefined ? this.initialData.active : true]
    });
  }

  async loadData(id: number): Promise<void> {
    this.initialData = await this.apiService.getRecipeCategoryById(id);
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageRecipeCategory = { ...this.formGroup.value };
      const uploadFilesControl = this.formGroup.get('imagePath');
      if (uploadFilesControl && uploadFilesControl.value && uploadFilesControl.value.length > 0) {
        formValue.imagePath = uploadFilesControl.value;
      }
      if (this.isEditMode && this.initialData) {
        formValue.recipeCategoryId = this.initialData.recipeCategoryId;
        await this.apiService.updateRecipeCategory(this.initialData.recipeCategoryId, formValue);
      } else {
        await this.apiService.createRecipeCategory(formValue);
      }
      this.router.navigate(['/lov-master/recipe-category']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/lov-master/recipe-category']);
  }
}
