import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NgxEditorComponent, NgxEditorMenuComponent, Editor } from 'ngx-editor';
import { FormsModule } from '@angular/forms';
import { InputErrorComponent, UploadFormComponent, ValidationUtil, SeoFormComponent } from '@shared';
import { ProgramsApiService } from '../api.service';
import {
  IProgram,
  IManageProgram,
  InputLengthEnum,
  IDropdownItem,
  FileTypeEnum,
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
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    program: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_100)]],
    programCategoryId: ['', [Validators.required]],
    punchLine: ['', [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_250)]],
    details: ['', [Validators.required]],
    idealFor: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
    sequenceNumber: [0, [Validators.required, Validators.min(0)]],
    isSpecialProgram: [false, [Validators.required]],
    videoUrl: ['', [Validators.maxLength(InputLengthEnum.CHAR_500)]],
    active: [true, [Validators.required]]
  });
  initialData!: IProgram;
  isEditMode = false;
  pageTitle = 'Create Program';
  programCategoryOptions: IDropdownItem[] = [];
  mediaFor = MediaForEnum.PROGRAM;
  mediaType = FileTypeEnum.IMAGE;
  editor: Editor | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ProgramsApiService
  ) {}

  async ngOnInit(): Promise<void> {
    this.initializeEditor();
    const id = this.route.snapshot.paramMap.get('id');
    await this.loadMasterData();
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Program';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Program';
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
        program: this.initialData.program || '',
        programCategoryId: this.initialData.programCategoryId || '',
        punchLine: this.initialData.punchLine || '',
        details: this.initialData.details || '',
        idealFor: this.initialData.idealFor || '',
        sequenceNumber: this.initialData.sequenceNumber || 0,
        isSpecialProgram: this.initialData.isSpecialProgram !== undefined ? this.initialData.isSpecialProgram : false,
        videoUrl: this.initialData.videoUrl || '',
        active: this.initialData.active !== undefined ? this.initialData.active : true
      });
    }
  }

  async loadMasterData(): Promise<void> {
    try {
      const masterData = await this.apiService.getMasterData();
      this.programCategoryOptions = masterData.programCategory || [];
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch (error) {
      console.error('Error loading program:', error);
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
        formValue.seo.tags = seoValue.tags ? (typeof seoValue.tags === 'string' ? seoValue.tags.split(', ').filter((t: string) => t.trim()) : seoValue.tags) : undefined;
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
      if (this.isEditMode && this.initialData) {
        formValue.programId = this.initialData.programId;
        await this.apiService.update(this.initialData.programId, formValue);
      } else {
        await this.apiService.create(formValue);
      }
      this.router.navigate(['/programs']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/programs']);
  }

  ngOnDestroy(): void {
    if (this.editor) {
      try {
        this.editor.destroy();
      } catch (error) {
        // Ignore destroy errors
        console.warn('Error destroying editor:', error);
      }
      this.editor = null as any;
    }
  }
}
