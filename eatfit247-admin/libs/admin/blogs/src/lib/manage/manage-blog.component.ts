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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Editor, NgxEditorComponent, NgxEditorMenuComponent } from 'ngx-editor';
import { InputErrorComponent, SeoFormComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { BlogsApiService } from '../api.service';
import { FileTypeEnum, IBlog, IDropdownItem, IManageBlog, InputLengthEnum, MediaForEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-blog',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    FormsModule,
    NgxEditorComponent,
    NgxEditorMenuComponent,
    InputErrorComponent,
    UploadFormComponent,
    SeoFormComponent
  ],
  templateUrl: './manage-blog.html',
  styleUrl: './manage-blog.scss'
})
export class ManageBlog implements OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_100)]],
    blogCategoryId: ['', [Validators.required]],
    blogAuthorId: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2)]],
    isPublished: [false, [Validators.required]],
    isCommentAllow: [false, [Validators.required]],
    isMailSentToSubscriber: [false, [Validators.required]],
    writtenAt: [new Date(), [Validators.required]],
    active: [true, [Validators.required]]
  });
  initialData!: IBlog;
  isEditMode = false;
  pageTitle = 'Create Blog';
  blogCategoryOptions: IDropdownItem[] = [];
  blogAuthorOptions: IDropdownItem[] = [];
  mediaFor = MediaForEnum.BLOG;
  mediaType = FileTypeEnum.IMAGE;
  editor: Editor | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: BlogsApiService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    this.initializeEditor();
    const id = this.route.snapshot.paramMap.get('id');
    await this.loadMasterData();
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Blog';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Blog';
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
      const writtenAt = this.initialData.writtenAt
        ? (typeof this.initialData.writtenAt === 'string' ? new Date(this.initialData.writtenAt) : this.initialData.writtenAt)
        : new Date();
      this.formGroup.patchValue({
        title: this.initialData.title || '',
        blogCategoryId: this.initialData.blogCategoryId || '',
        blogAuthorId: this.initialData.blogAuthorId || '',
        description: this.initialData.description || '',
        isPublished: this.initialData.isPublished !== undefined ? this.initialData.isPublished : false,
        isCommentAllow: this.initialData.isCommentAllow !== undefined ? this.initialData.isCommentAllow : false,
        isMailSentToSubscriber: this.initialData.isMailSentToSubscriber !== undefined ? this.initialData.isMailSentToSubscriber : false,
        writtenAt: writtenAt,
        active: this.initialData.active !== undefined ? this.initialData.active : true
      });
    }
  }

  async loadMasterData(): Promise<void> {
    try {
      const masterData = await this.apiService.getMasterData();
      this.blogCategoryOptions = masterData.blogCategory || [];
      this.blogAuthorOptions = masterData.blogAuthor || [];
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  getImagePathList(): any[] {
    if (!this.initialData || !this.initialData.imagePath) {
      return [];
    }
    return Array.isArray(this.initialData.imagePath) ? this.initialData.imagePath : [];
  }

  // Get max length from InputLengthEnum to match DTO validators
  getMaxLength(controlName: string): number | null {
    // Map control names to their max length values from DTO
    const maxLengthMap: { [key: string]: number } = {
      title: InputLengthEnum.CHAR_100
    };
    return maxLengthMap[controlName] || null;
  }

  getCurrentLength(controlName: string): number {
    const control = this.formGroup.get(controlName);
    return control?.value?.length || 0;
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageBlog = { ...this.formGroup.value };
      // Handle imagePath from the upload form
      const imagePathControl = this.formGroup.get('imagePath');
      if (imagePathControl) {
        const imagePathValue = imagePathControl.value;
        if (Array.isArray(imagePathValue) && imagePathValue.length > 0) {
          formValue.imagePath = imagePathValue;
        } else {
          formValue.imagePath = undefined;
        }
      } else {
        formValue.imagePath = undefined;
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
        const blogId = (this.initialData as any).blogId;
        await this.apiService.update(blogId, formValue);
        this.snackBar.open('Blog updated successfully', 'Close', {
          duration: 3000,
        });
      } else {
        await this.apiService.create(formValue);
        this.snackBar.open('Blog created successfully', 'Close', {
          duration: 3000,
        });
      }
      this.router.navigate(['/blogs']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/blogs']);
  }

  ngOnDestroy(): void {
    if (this.editor) {
      try {
        this.editor.destroy();
      } catch (error) {
        // Ignore destroy errors
      }
      this.editor = null as any;
    }
  }
}
