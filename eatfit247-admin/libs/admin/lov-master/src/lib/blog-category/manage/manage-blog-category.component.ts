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
import { BlogCategoryApiService } from '../../api.service';
import { FileTypeEnum, IBlogCategory, IManageBlogCategory, InputLengthEnum, MediaForEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-blog-category',
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
  templateUrl: './manage-blog-category.html',
  styleUrl: './manage-blog-category.scss'
})
export class ManageBlogCategory implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(BlogCategoryApiService);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    blogCategory: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_50)]],
    url: ['', [Validators.maxLength(InputLengthEnum.CHAR_200)]],
    active: [true, [Validators.required]]
  });
  initialData!: IBlogCategory;
  mediaFor = MediaForEnum.BLOG_CATEGORY;
  mediaType = FileTypeEnum.IMAGE;
  isEditMode = false;
  pageTitle = 'Create Blog Category';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Blog Category';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Blog Category';
    }
    this.buildForm();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      blogCategory: [
        this.initialData?.blogCategory || '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.CHAR_2),
          Validators.maxLength(InputLengthEnum.CHAR_50)
        ]
      ],
      url: [this.initialData?.url || '', [Validators.maxLength(InputLengthEnum.CHAR_200)]],
      active: [this.initialData?.active !== undefined ? this.initialData.active : true]
    });
  }

  async loadData(id: number): Promise<void> {
    this.initialData = await this.apiService.getById(id);
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageBlogCategory = { ...this.formGroup.value };
      const uploadFilesControl = this.formGroup.get('imagePath');
      if (uploadFilesControl && uploadFilesControl.value && uploadFilesControl.value.length > 0) {
        formValue.imagePath = uploadFilesControl.value;
      }
      if (!formValue.url) {
        delete formValue.url;
      }
      if (this.isEditMode && this.initialData) {
        formValue.blogCategoryId = this.initialData.blogCategoryId;
        await this.apiService.update(this.initialData.blogCategoryId, formValue);
      } else {
        await this.apiService.create(formValue);
      }
      this.router.navigate(['/lov-master/blog-category']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/lov-master/blog-category']);
  }
}
