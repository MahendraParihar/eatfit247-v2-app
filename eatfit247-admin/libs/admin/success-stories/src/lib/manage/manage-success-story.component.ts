import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { SuccessStoriesApiService } from '../api.service';
import { FileTypeEnum, InputLengthEnum, ISuccessStory, MediaForEnum } from '@eatfit247-shared-lib';
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
    InputErrorComponent,
    UploadFormComponent,
    NgxEditorComponent,
    NgxEditorMenuComponent,
  ],
  templateUrl: './manage-success-story.html',
  styleUrl: './manage-success-story.scss',
})
export class ManageSuccessStory implements OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_250)],
    ],
    title: [
      '',
      [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_250)],
    ],
    date: ['', [Validators.required]],
    description: ['', [Validators.required]],
    imagePath: [[], [Validators.required]],
    active: [true, [Validators.required]],
  });
  initialData!: ISuccessStory;
  isEditMode = false;
  pageTitle = 'Create Success Story';
  mediaFor = MediaForEnum.SUCCESS_STORY;
  mediaType = FileTypeEnum.IMAGE;
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: SuccessStoriesApiService,
  ) {}

  ngOnInit(): void {
    this.initializeEditor();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Success Story';
      this.loadData(+id);
    } else {
      this.pageTitle = 'Create Success Story';
    }
  }

  private initializeEditor(): void {
    this.editor = new Editor();
  }

  private patchFormValues(): void {
    if (this.initialData) {
      // Format date for date picker (YYYY-MM-DD)
      const dateValue =
        this.initialData.date instanceof Date
          ? this.initialData.date
          : new Date(this.initialData.date);

      this.formGroup.patchValue({
        name: this.initialData.name || '',
        title: this.initialData.title || '',
        date: dateValue,
        description: this.initialData.description || '',
        active:
          this.initialData.active !== undefined
            ? this.initialData.active
            : true,
      });
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
      if (this.initialData) {
        this.patchFormValues();
      }
    } catch (error) {
      console.error('Error loading success story:', error);
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: any = { ...this.formGroup.value };

      // Format date as YYYY-MM-DD string
      if (formValue.date instanceof Date) {
        formValue.date = formValue.date.toISOString().split('T')[0];
      }

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

      if (this.isEditMode && this.initialData) {
        const successStoryId = (this.initialData as any).successStoryId;
        await this.apiService.update(successStoryId, formValue);
      } else {
        await this.apiService.create(formValue);
      }
      this.router.navigate(['/success-stories']);
    } else {
      this.formGroup.markAllAsTouched();
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

