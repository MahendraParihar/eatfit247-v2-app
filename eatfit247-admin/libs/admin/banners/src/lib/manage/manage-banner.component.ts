import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { BannersApiService } from '../api.service';
import {
  BannerForEnum,
  FileTypeEnum,
  IBanner,
  IManageBanner,
  InputLengthEnum,
  MediaForEnum
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-banner',
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
    InputErrorComponent,
    UploadFormComponent
  ],
  templateUrl: './manage-banner.html',
  styleUrl: './manage-banner.scss'
})
export class ManageBanner implements OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_100)]],
    subTitle: ['', [Validators.maxLength(InputLengthEnum.CHAR_200)]],
    active: [true, [Validators.required]],
    bannerFor: [BannerForEnum.HOME, [Validators.required]],
    imagePosition: ['center', [Validators.maxLength(10)]],
    titleIcon: ['', [Validators.maxLength(20)]],
    description: [''],
    primaryActionText: ['', [Validators.maxLength(50)]],
    primaryActionUrl: ['', [Validators.maxLength(100)]],
    secondaryActionText: ['', [Validators.maxLength(50)]],
    secondaryActionUrl: ['', [Validators.maxLength(100)]]
  });
  initialData!: IBanner;
  isEditMode = false;
  pageTitle = 'Create Banner';
  mediaFor = MediaForEnum.HOME;
  mediaType = FileTypeEnum.IMAGE;
  bannerForOptions = Object.values(BannerForEnum).map(value => ({
    value,
    label: value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));
  imagePositionOptions = [
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
    { value: 'center', label: 'Center' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: BannersApiService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Banner';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Banner';
    }
    this.patchFormValues();
  }

  private patchFormValues(): void {
    if (this.initialData) {
      this.formGroup.patchValue({
        title: this.initialData.title || '',
        subTitle: this.initialData.subTitle || '',
        active: this.initialData.active !== undefined ? this.initialData.active : true,
        bannerFor: this.initialData.bannerFor || BannerForEnum.HOME,
        imagePosition: this.initialData.imagePosition || 'center',
        titleIcon: this.initialData.titleIcon || '',
        description: this.initialData.description || '',
        primaryActionText: this.initialData.primaryActionText || '',
        primaryActionUrl: this.initialData.primaryActionUrl || '',
        secondaryActionText: this.initialData.secondaryActionText || '',
        secondaryActionUrl: this.initialData.secondaryActionUrl || ''
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

  getMaxLength(controlName: string): number | null {
    const maxLengthMap: { [key: string]: number } = {
      title: InputLengthEnum.CHAR_100,
      subTitle: InputLengthEnum.CHAR_200,
      imagePosition: 10,
      titleIcon: 20,
      primaryActionText: 50,
      primaryActionUrl: 100,
      secondaryActionText: 50,
      secondaryActionUrl: 100
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
      const formValue: IManageBanner = { ...this.formGroup.value };
      // Handle imagePath from the upload form
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
        const bannerId = this.initialData.bannerId;
        await this.apiService.update(bannerId, formValue);
        this.snackBar.open('Banner updated successfully', 'Close', {
          duration: 3000,
        });
      } else {
        await this.apiService.create(formValue);
        this.snackBar.open('Banner created successfully', 'Close', {
          duration: 3000,
        });
      }
      this.router.navigate(['/banners']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/banners']);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}

