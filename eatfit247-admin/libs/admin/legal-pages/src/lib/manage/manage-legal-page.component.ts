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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Editor, NgxEditorComponent, NgxEditorMenuComponent } from 'ngx-editor';
import { InputErrorComponent, SeoFormComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { LegalPagesApiService } from '../api.service';
import { FileTypeEnum, ILegalPageList, IManageLegalPage, InputLengthEnum, MediaForEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-legal-page',
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
    MatSnackBarModule,
    FormsModule,
    NgxEditorComponent,
    NgxEditorMenuComponent,
    InputErrorComponent,
    UploadFormComponent,
    SeoFormComponent
  ],
  templateUrl: './manage-legal-page.html',
  styleUrl: './manage-legal-page.scss'
})
export class ManageLegalPage implements OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_50)]],
    details: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2)]],
    active: [true, [Validators.required]]
  });
  initialData!: ILegalPageList;
  isEditMode = false;
  pageTitle = 'Create Legal Page';
  mediaFor = MediaForEnum.LEGAL_PAGE;
  mediaType = FileTypeEnum.IMAGE;
  editor: Editor | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: LegalPagesApiService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    this.initializeEditor();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Legal Page';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Legal Page';
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
      this.formGroup.patchValue({
        title: this.initialData.title || '',
        details: this.initialData.details || '',
        active: this.initialData.active !== undefined ? this.initialData.active : true
      });
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
      title: InputLengthEnum.CHAR_50
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
      const formValue: IManageLegalPage = { ...this.formGroup.value };
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
      }
      if (this.isEditMode && this.initialData) {
        const legalPageId = this.initialData.legalPageId;
        await this.apiService.update(legalPageId, formValue);
        this.snackBar.open('Legal page updated successfully', 'Close', {
          duration: 3000,
        });
      } else {
        await this.apiService.create(formValue);
        this.snackBar.open('Legal page created successfully', 'Close', {
          duration: 3000,
        });
      }
      this.router.navigate(['/legal-pages']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/legal-pages']);
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

