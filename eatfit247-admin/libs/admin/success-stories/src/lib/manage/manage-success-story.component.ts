import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { SuccessStoriesApiService } from '../api.service';
import {
  FileTypeEnum,
  IMediaUpload,
  InputLengthEnum,
  ISuccessStory,
  MediaForEnum,
  SuccessStoryMediaType,
} from '@eatfit247-shared-lib';
import { Editor, NgxEditorComponent, NgxEditorMenuComponent, Toolbar } from 'ngx-editor';

@Component({
  selector: 'lib-manage-success-story',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    InputErrorComponent,
    UploadFormComponent,
    NgxEditorComponent,
    NgxEditorMenuComponent,
  ],
  templateUrl: './manage-success-story.html',
  styleUrl: './manage-success-story.scss',
})
export class ManageSuccessStory implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(SuccessStoriesApiService);
  private snackBar = inject(MatSnackBar);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_250)]],
    title: ['', [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_250)]],
    date: ['', [Validators.required]],
    description: ['', [Validators.required]],
    mediaType: ['image' as SuccessStoryMediaType, [Validators.required]],
    youtubeUrl: ['', [Validators.maxLength(InputLengthEnum.CHAR_500)]],
    active: [true, [Validators.required]],
  });
  initialData!: ISuccessStory;
  initialMediaList: IMediaUpload[] = [];
  isEditMode = false;
  pageTitle = 'Create Success Story';
  mediaFor = MediaForEnum.SUCCESS_STORY;
  mediaTypeEnum = FileTypeEnum;
  editor: Editor | null = null;
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];
  mediaTypeOptions: { value: SuccessStoryMediaType; label: string }[] = [
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'youtube', label: 'YouTube Link' },
  ];

  get mediaType(): SuccessStoryMediaType {
    return this.formGroup.get('mediaType')?.value as SuccessStoryMediaType;
  }

  get uploadFileType(): FileTypeEnum {
    return this.mediaType === 'video' ? FileTypeEnum.VIDEO : FileTypeEnum.IMAGE;
  }

  ngOnInit(): void {
    this.initializeEditor();
    this.formGroup.get('mediaType')?.valueChanges.subscribe((value: SuccessStoryMediaType) => {
      this.onMediaTypeChange(value);
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Success Story';
      this.loadData(+id);
    } else {
      this.pageTitle = 'Create Success Story';
      this.applyMediaTypeValidators(this.mediaType);
    }
  }

  private initializeEditor(): void {
    this.editor = new Editor();
  }

  private onMediaTypeChange(value: SuccessStoryMediaType): void {
    this.applyMediaTypeValidators(value);
    // Reset opposite-side controls so stale data does not leak across types.
    const youtubeCtrl = this.formGroup.get('youtubeUrl');
    const imageCtrl = this.formGroup.get('imagePath');
    if (value === 'youtube') {
      if (imageCtrl instanceof FormArray) {
        imageCtrl.clear();
      } else if (imageCtrl) {
        imageCtrl.setValue([]);
      }
      this.initialMediaList = [];
    } else {
      youtubeCtrl?.setValue('');
    }
  }

  private applyMediaTypeValidators(value: SuccessStoryMediaType): void {
    const youtubeCtrl = this.formGroup.get('youtubeUrl');
    if (value === 'youtube') {
      youtubeCtrl?.setValidators([
        Validators.required,
        Validators.maxLength(InputLengthEnum.CHAR_500),
      ]);
    } else {
      youtubeCtrl?.setValidators([Validators.maxLength(InputLengthEnum.CHAR_500)]);
    }
    youtubeCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private patchFormValues(): void {
    if (!this.initialData) {
      return;
    }
    const dateValue =
      this.initialData.date instanceof Date
        ? this.initialData.date
        : new Date(this.initialData.date);
    const mediaType: SuccessStoryMediaType = this.initialData.mediaType || 'image';
    this.formGroup.patchValue(
      {
        name: this.initialData.name || '',
        title: this.initialData.title || '',
        date: dateValue,
        description: this.initialData.description || '',
        mediaType,
        youtubeUrl: this.initialData.youtubeUrl || '',
        active: this.initialData.active !== undefined ? this.initialData.active : true,
      },
      { emitEvent: false },
    );
    this.initialMediaList = mediaType === 'youtube' ? [] : this.initialData.imagePath || [];
    this.applyMediaTypeValidators(mediaType);
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
      if (this.initialData) {
        this.patchFormValues();
      }
    } catch (error) {
      this.snackBar.open('Failed to load success story. Please try again.', 'Close', {
        duration: 5000,
      });
      this.router.navigate(['/success-stories']);
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    const mediaType = this.mediaType;
    const imageCtrl = this.formGroup.get('imagePath');
    const uploadedFiles = imageCtrl instanceof FormArray ? imageCtrl.value : imageCtrl?.value;

    if (mediaType !== 'youtube' && (!Array.isArray(uploadedFiles) || uploadedFiles.length === 0)) {
      this.snackBar.open(`Please upload a ${mediaType} file before saving.`, 'Close', {
        duration: 4000,
      });
      return;
    }

    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue: any = { ...this.formGroup.value };
    if (formValue.date instanceof Date) {
      formValue.date = formValue.date.toISOString().split('T')[0];
    }
    if (mediaType === 'youtube') {
      formValue.imagePath = [];
      formValue.youtubeUrl = (formValue.youtubeUrl || '').trim();
    } else {
      formValue.imagePath = Array.isArray(uploadedFiles) ? uploadedFiles : [];
      formValue.youtubeUrl = undefined;
    }

    try {
      if (this.isEditMode && this.initialData) {
        const successStoryId = (this.initialData as any).successStoryId;
        await this.apiService.update(successStoryId, formValue);
        this.snackBar.open('Success story updated successfully', 'Close', { duration: 3000 });
      } else {
        await this.apiService.create(formValue);
        this.snackBar.open('Success story created successfully', 'Close', { duration: 3000 });
      }
      this.router.navigate(['/success-stories']);
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  onCancel(): void {
    this.router.navigate(['/success-stories']);
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.destroy();
    }
  }
}
