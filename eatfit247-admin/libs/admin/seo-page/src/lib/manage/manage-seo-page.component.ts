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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputErrorComponent, ValidationUtil } from '@shared';
import { SeoPageApiService } from '../api.service';
import { IManageSeoPage, InputLengthEnum, ISeoPage } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-seo-page',
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
    InputErrorComponent
  ],
  templateUrl: './manage-seo-page.html',
  styleUrl: './manage-seo-page.scss'
})
export class ManageSeoPage implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    url: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2)]],
    metaTitle: ['', [Validators.maxLength(InputLengthEnum.CHAR_200)]],
    metaDescription: ['', [Validators.maxLength(InputLengthEnum.CHAR_500)]],
    canonicalUrl: [''],
    ogType: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
    ogTitle: ['', [Validators.maxLength(InputLengthEnum.CHAR_200)]],
    ogDescription: ['', [Validators.maxLength(InputLengthEnum.CHAR_500)]],
    ogUrl: [''],
    twitterCard: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
    active: [true, [Validators.required]]
  });
  initialData!: ISeoPage;
  isEditMode = false;
  pageTitle = 'Create SEO Page';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: SeoPageApiService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit SEO Page';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create SEO Page';
    }
    this.patchFormValues();
  }

  private patchFormValues(): void {
    if (this.initialData) {
      this.formGroup.patchValue({
        url: this.initialData.url || '',
        metaTitle: this.initialData.metaTitle || '',
        metaDescription: this.initialData.metaDescription || '',
        canonicalUrl: this.initialData.canonicalUrl || '',
        ogType: this.initialData.ogType || '',
        ogTitle: this.initialData.ogTitle || '',
        ogDescription: this.initialData.ogDescription || '',
        ogUrl: this.initialData.ogUrl || '',
        twitterCard: this.initialData.twitterCard || '',
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

  getMaxLength(controlName: string): number | null {
    const maxLengthMap: { [key: string]: number } = {
      metaTitle: InputLengthEnum.CHAR_200,
      metaDescription: InputLengthEnum.CHAR_500,
      ogType: InputLengthEnum.CHAR_50,
      ogTitle: InputLengthEnum.CHAR_200,
      ogDescription: InputLengthEnum.CHAR_500,
      twitterCard: InputLengthEnum.CHAR_50
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
      const formValue: IManageSeoPage = { ...this.formGroup.value };
      if (this.isEditMode && this.initialData) {
        const seoPageId = this.initialData.seoPageId;
        await this.apiService.update(seoPageId, formValue);
        this.snackBar.open('SEO page updated successfully', 'Close', {
          duration: 3000,
        });
      } else {
        await this.apiService.create(formValue);
        this.snackBar.open('SEO page created successfully', 'Close', {
          duration: 3000,
        });
      }
      this.router.navigate(['/seo-page']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/seo-page']);
  }
}

