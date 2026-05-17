import { Component, inject, OnInit } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputErrorComponent, ValidationUtil } from '@shared';
import { GoogleReviewsApiService } from '../api.service';
import {
  GoogleReviewEntityTypeEnum,
  GoogleReviewSourceEnum,
  IGoogleReview,
  IManageGoogleReview,
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-google-review',
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
  ],
  templateUrl: './manage-google-review.html',
  styleUrl: './manage-google-review.scss',
})
export class ManageGoogleReview implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(GoogleReviewsApiService);
  private snackBar = inject(MatSnackBar);
  private fb: FormBuilder = inject(FormBuilder);

  formGroup: FormGroup = this.fb.group({
    entityType: [GoogleReviewEntityTypeEnum.Product, [Validators.required]],
    entityId: [null, [Validators.required, Validators.min(1)]],
    source: [GoogleReviewSourceEnum.Manual, [Validators.required]],
    googleReviewIdExt: [''],
    reviewerName: ['', [Validators.required, Validators.maxLength(150)]],
    reviewerRole: ['', [Validators.maxLength(200)]],
    reviewerPhotoUrl: ['', [Validators.maxLength(500)]],
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    reviewText: [''],
    reviewDate: [new Date(), [Validators.required]],
    language: ['en', [Validators.maxLength(10)]],
    adminReply: [''],
    isPublished: [true, [Validators.required]],
    displayOrder: [0],
    active: [true, [Validators.required]],
  });

  initialData!: IGoogleReview;
  isEditMode = false;
  pageTitle = 'Create Google Review';

  entityTypeOptions = [
    { value: GoogleReviewEntityTypeEnum.Product, label: 'Product' },
    { value: GoogleReviewEntityTypeEnum.ProgramPlan, label: 'Program Plan' },
  ];

  sourceOptions = [
    { value: GoogleReviewSourceEnum.Manual, label: 'Manual' },
    { value: GoogleReviewSourceEnum.Google, label: 'Google' },
  ];

  ratingOptions = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Google Review';
      this.loadData(+id);
    }
  }

  private patchFormValues(): void {
    if (!this.initialData) return;
    const reviewDate = this.initialData.reviewDate
      ? new Date(this.initialData.reviewDate)
      : new Date();
    this.formGroup.patchValue({
      entityType: this.initialData.entityType,
      entityId: this.initialData.entityId,
      source: this.initialData.source,
      googleReviewIdExt: this.initialData.googleReviewIdExt || '',
      reviewerName: this.initialData.reviewerName,
      reviewerRole: this.initialData.reviewerRole || '',
      reviewerPhotoUrl: this.initialData.reviewerPhotoUrl || '',
      rating: this.initialData.rating,
      reviewText: this.initialData.reviewText || '',
      reviewDate,
      language: this.initialData.language || 'en',
      adminReply: this.initialData.adminReply || '',
      isPublished: this.initialData.isPublished,
      displayOrder: this.initialData.displayOrder || 0,
      active: this.initialData.active,
    });
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
      if (this.initialData) {
        this.patchFormValues();
      }
    } catch {
      this.snackBar.open('Failed to load review. Please try again.', 'Close', { duration: 5000 });
      this.router.navigate(['/google-reviews']);
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    const v = this.formGroup.value;
    const payload: IManageGoogleReview = {
      entityType: v.entityType,
      entityId: Number(v.entityId),
      source: v.source,
      googleReviewIdExt: v.googleReviewIdExt || null,
      reviewerName: v.reviewerName,
      reviewerRole: v.reviewerRole || null,
      reviewerPhotoUrl: v.reviewerPhotoUrl || null,
      rating: Number(v.rating),
      reviewText: v.reviewText || null,
      reviewDate: v.reviewDate,
      language: v.language || 'en',
      isPublished: !!v.isPublished,
      displayOrder: Number(v.displayOrder) || 0,
      active: !!v.active,
    };

    try {
      if (this.isEditMode && this.initialData) {
        await this.apiService.update(this.initialData.googleReviewId, payload);
        this.snackBar.open('Google review updated successfully', 'Close', { duration: 3000 });
        const replyValue = v.adminReply?.trim();
        if (replyValue && replyValue !== (this.initialData.adminReply || '').trim()) {
          await this.apiService.reply(this.initialData.googleReviewId, { adminReply: replyValue });
        }
      } else {
        await this.apiService.create(payload);
        this.snackBar.open('Google review created successfully', 'Close', { duration: 3000 });
      }
      this.router.navigate(['/google-reviews']);
    } catch {
      // HttpErrorInterceptor surfaces toasts
    }
  }

  onCancel(): void {
    this.router.navigate(['/google-reviews']);
  }
}
