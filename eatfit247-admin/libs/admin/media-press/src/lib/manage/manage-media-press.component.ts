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
import { InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { PressMediaApiService } from '../api.service';
import {
  IPressMedia,
  InputLengthEnum,
  FileTypeEnum,
  MediaForEnum
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-media-press',
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
    InputErrorComponent,
    UploadFormComponent
  ],
  templateUrl: './manage-media-press.html',
  styleUrl: './manage-media-press.scss'
})
export class ManageMediaPress implements OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    title: ['', [Validators.maxLength(InputLengthEnum.CHAR_200)]],
    type: ['', [Validators.required]],
    link: ['', [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_500)]],
    active: [true, [Validators.required]]
  });
  initialData!: IPressMedia;
  isEditMode = false;
  pageTitle = 'Create Media & Press';
  mediaFor = MediaForEnum.PRESS_MEDIA;
  mediaType = FileTypeEnum.IMAGE;
  typeOptions = [
    { value: 'youtube', label: 'YouTube' },
    { value: 'press', label: 'Press' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: PressMediaApiService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Media & Press';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Media & Press';
      // Only patch if not loading data
      this.patchFormValues();
    }
  }

  private patchFormValues(): void {
    if (this.initialData) {
      this.formGroup.patchValue({
        title: this.initialData.title || '',
        type: this.initialData.type || '',
        link: this.initialData.link || '',
        active: this.initialData.active !== undefined ? this.initialData.active : true
      });
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
      // Ensure we have the data before patching
      if (this.initialData) {
        this.patchFormValues();
      }
    } catch (error) {
      console.error('Error loading media & press:', error);
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: any = { ...this.formGroup.value };
      
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
      if (!formValue.title) {
        delete formValue.title;
      }
      
      if (this.isEditMode && this.initialData) {
        const pressMediaId = (this.initialData as any).pressMediaId;
        await this.apiService.update(pressMediaId, formValue);
      } else {
        await this.apiService.create(formValue);
      }
      this.router.navigate(['/media-press']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/media-press']);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}