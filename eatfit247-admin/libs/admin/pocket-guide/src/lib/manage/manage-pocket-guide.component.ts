import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Editor, NgxEditorComponent, NgxEditorMenuComponent } from 'ngx-editor';
import { InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { PocketGuideApiService } from '../api.service';
import { FileTypeEnum, InputLengthEnum, IPocketGuide, MediaForEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-pocket-guide',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    MatSelectModule,
    MatSnackBarModule,
    FormsModule,
    NgxEditorComponent,
    NgxEditorMenuComponent,
    InputErrorComponent,
    UploadFormComponent
  ],
  templateUrl: './manage-pocket-guide.html',
  styleUrl: './manage-pocket-guide.scss'
})
export class ManagePocketGuide implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(PocketGuideApiService);
  private snackBar = inject(MatSnackBar);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    pocketGuide: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_50)]],
    description: [''],
    active: [true, [Validators.required]]
  });
  initialData: IPocketGuide | null = null;
  isEditMode = false;
  pageTitle = 'Create Pocket Guide';
  mediaFor = MediaForEnum.POCKET_GUIDE;
  imageMediaType = FileTypeEnum.IMAGE;
  fileMediaType = FileTypeEnum.PDF;
  editor: Editor | null = null;

  async ngOnInit(): Promise<void> {
    this.initializeEditor();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Pocket Guide';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Pocket Guide';
      this.patchFormValues();
    }
  }

  private initializeEditor(): void {
    if (!this.editor) {
      this.editor = new Editor();
    }
  }

  private patchFormValues(): void {
    if (this.initialData) {
      this.formGroup.patchValue({
        pocketGuide: this.initialData.pocketGuide || '',
        description: this.initialData.description || '',
        active: this.initialData.active !== undefined ? this.initialData.active : true
      });
    }
  }

  getFilePathList(): any[] {
    if (!this.initialData || !this.initialData.filePath) {
      return [];
    }
    if (Array.isArray(this.initialData.filePath)) {
      return this.initialData.filePath;
    }
    if (typeof this.initialData.filePath === 'string') {
      try {
        const parsed = JSON.parse(this.initialData.filePath);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [];
      }
    }
    return [];
  }

  getImagePathList(): any[] {
    if (!this.initialData || !this.initialData.imagePath) {
      return [];
    }
    if (Array.isArray(this.initialData.imagePath)) {
      return this.initialData.imagePath;
    }
    return [this.initialData.imagePath];
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
      if (this.initialData) {
        this.patchFormValues();
      }
    } catch (error) {
      this.snackBar.open('Failed to load pocket guide. Please try again.', 'Close', {
        duration: 5000,
      });
      this.router.navigate(['/pocket-guide']);
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: any = { ...this.formGroup.value };
      
      // Handle filePath from upload form (for PDF/document files)
      const filePathControl = this.formGroup.get('filePath');
      if (filePathControl) {
        const filePathValue = filePathControl.value;
        if (Array.isArray(filePathValue) && filePathValue.length > 0) {
          formValue.filePath = filePathValue;
        } else {
          formValue.filePath = undefined;
        }
      } else {
        formValue.filePath = undefined;
      }

      // Handle imagePath from upload form
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
      
      // Clean up empty optional fields
      if (!formValue.description) {
        delete formValue.description;
      }
      
      try {
        if (this.isEditMode && this.initialData) {
          const pocketGuideId = (this.initialData as any).pocketGuideId;
          await this.apiService.update(pocketGuideId, formValue);
          this.snackBar.open('Pocket guide updated successfully', 'Close', {
            duration: 3000,
          });
        } else {
          await this.apiService.create(formValue);
          this.snackBar.open('Pocket guide created successfully', 'Close', {
            duration: 3000,
          });
        }
        this.router.navigate(['/pocket-guide']);
      } catch (error) {
        // Error toast is handled by HttpErrorInterceptor
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/pocket-guide']);
  }

  ngOnDestroy(): void {
    if (this.editor) {
      try {
        this.editor.destroy();
      } catch {
        // Ignore destroy errors
      }
      this.editor = null as any;
    }
  }
}