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
import { ProgramsApiService } from '../api.service';
import {
  CommonUtil,
  FileTypeEnum,
  IManageProgram,
  InputLengthEnum,
  IProgram,
  MediaForEnum
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-program',
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
  templateUrl: './manage-program.html',
  styleUrl: './manage-program.scss'
})
export class ManageProgram implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ProgramsApiService);
  private snackBar = inject(MatSnackBar);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    program: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_100)]],
    punchLine: ['', [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_250)]],
    details: ['', [Validators.required]],
    idealFor: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
    sequenceNumber: [0, [Validators.required, Validators.min(0)]],
    isSpecialProgram: [false, [Validators.required]],
    startDate: [null as Date | null],
    endDate: [null as Date | null],
    maxPeopleCanRegister: [null as number | null, [Validators.min(0)]],
    videoUrl: ['', [Validators.maxLength(InputLengthEnum.CHAR_500)]],
    active: [true, [Validators.required]]
  });
  initialData!: IProgram;
  isEditMode = false;
  pageTitle = 'Create Program';
  mediaFor = MediaForEnum.PROGRAM;
  mediaType = FileTypeEnum.IMAGE;
  editor: Editor | null = null;
  private urlManuallyEdited = false;

  async ngOnInit(): Promise<void> {
    this.initializeEditor();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Program';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Program';
    }
    this.patchFormValues();
    this.applySpecialProgramValidators(this.formGroup.get('isSpecialProgram')?.value);
    this.setupUrlAutoFill();
    this.formGroup.get('isSpecialProgram')?.valueChanges.subscribe((isSpecial: boolean) => {
      this.applySpecialProgramValidators(isSpecial);
      if (!isSpecial) {
        this.formGroup.patchValue({
          startDate: null,
          endDate: null,
          maxPeopleCanRegister: null,
        }, { emitEvent: false });
      }
    });
  }

  private setupUrlAutoFill(): void {
    // The SEO sub-form is registered in SeoFormComponent.ngOnInit (child runs after parent),
    // so defer until the child has attached the 'seo' control.
    Promise.resolve().then(() => {
      const urlControl = this.formGroup.get('seo.url');
      if (!urlControl) {
        return;
      }
      // In edit mode, treat an existing URL as user-owned — don't overwrite it.
      if (this.isEditMode && urlControl.value) {
        this.urlManuallyEdited = true;
      }
      urlControl.valueChanges.subscribe((value: string | null) => {
        const programVal = this.formGroup.get('program')?.value || '';
        const expectedSlug = CommonUtil.slugify(programVal);
        // Mark as manually edited unless the change came from us (matches current slug).
        if ((value || '') !== expectedSlug) {
          this.urlManuallyEdited = true;
        }
      });
      this.formGroup.get('program')?.valueChanges.subscribe((name: string) => {
        if (this.urlManuallyEdited) {
          return;
        }
        urlControl.setValue(CommonUtil.slugify(name || ''), { emitEvent: false });
      });
    });
  }

  private applySpecialProgramValidators(isSpecial: boolean): void {
    const startDate = this.formGroup.get('startDate');
    const endDate = this.formGroup.get('endDate');
    const maxPeople = this.formGroup.get('maxPeopleCanRegister');
    if (isSpecial) {
      startDate?.setValidators([Validators.required]);
      endDate?.setValidators([Validators.required]);
      maxPeople?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      startDate?.clearValidators();
      endDate?.clearValidators();
      maxPeople?.clearValidators();
    }
    startDate?.updateValueAndValidity({ emitEvent: false });
    endDate?.updateValueAndValidity({ emitEvent: false });
    maxPeople?.updateValueAndValidity({ emitEvent: false });
  }

  private initializeEditor(): void {
    if (!this.editor) {
      this.editor = new Editor();
    }
  }

  private patchFormValues(): void {
    if (this.initialData) {
      this.formGroup.patchValue({
        program: this.initialData.program || '',
        punchLine: this.initialData.punchLine || '',
        details: this.initialData.details || '',
        idealFor: this.initialData.idealFor || '',
        sequenceNumber: this.initialData.sequenceNumber || 0,
        isSpecialProgram: this.initialData.isSpecialProgram !== undefined ? this.initialData.isSpecialProgram : false,
        startDate: this.initialData.startDate ? new Date(this.initialData.startDate as string) : null,
        endDate: this.initialData.endDate ? new Date(this.initialData.endDate as string) : null,
        maxPeopleCanRegister: this.initialData.maxPeopleCanRegister ?? null,
        videoUrl: this.initialData.videoUrl || '',
        active: this.initialData.active !== undefined ? this.initialData.active : true
      });
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch (error) {
      this.snackBar.open('Failed to load program. Please try again.', 'Close', {
        duration: 5000,
      });
      this.router.navigate(['/programs']);
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageProgram = { ...this.formGroup.value };
      const seoControl = this.formGroup.get('seo');
      if (seoControl && seoControl.value) {
        const seoValue = seoControl.value;
        formValue.seo = seoValue;
      }
      // Handle imagePath from upload form - read directly from FormArray control
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
      if (!formValue.idealFor) {
        delete formValue.idealFor;
      }
      if (!formValue.videoUrl) {
        delete formValue.videoUrl;
      }
      if (formValue.isSpecialProgram) {
        formValue.startDate = this.toIsoDate(formValue.startDate);
        formValue.endDate = this.toIsoDate(formValue.endDate);
        formValue.maxPeopleCanRegister = formValue.maxPeopleCanRegister ?? null;
      } else {
        formValue.startDate = null;
        formValue.endDate = null;
        formValue.maxPeopleCanRegister = null;
      }
      try {
        if (this.isEditMode && this.initialData) {
          formValue.programId = this.initialData.programId;
          await this.apiService.update(this.initialData.programId, formValue);
          this.snackBar.open('Program updated successfully', 'Close', {
            duration: 3000,
          });
        } else {
          await this.apiService.create(formValue);
          this.snackBar.open('Program created successfully', 'Close', {
            duration: 3000,
          });
        }
        this.router.navigate(['/programs']);
      } catch (error) {
        // Error toast is handled by HttpErrorInterceptor
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/programs']);
  }

  private toIsoDate(value: unknown): string | null {
    if (!value) {
      return null;
    }
    const d = value instanceof Date ? value : new Date(value as string);
    if (isNaN(d.getTime())) {
      return null;
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
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
