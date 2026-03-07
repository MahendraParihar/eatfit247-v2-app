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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputErrorComponent, ValidationUtil } from '@shared';
import { CourierProvidersApiService } from '../api.service';
import { ICourierProvider, IManageCourierProvider, InputLengthEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-courier-provider',
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
    MatSnackBarModule,
    InputErrorComponent
  ],
  templateUrl: './manage-courier-provider.html',
  styleUrl: './manage-courier-provider.scss'
})
export class ManageCourierProvider implements OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    providerCode: [
      '',
      [
        Validators.required,
        Validators.minLength(InputLengthEnum.CHAR_2),
        Validators.maxLength(30)
      ]
    ],
    providerName: [
      '',
      [
        Validators.required,
        Validators.minLength(InputLengthEnum.CHAR_2),
        Validators.maxLength(100)
      ]
    ],
    authType: ['API_KEY', [Validators.required]],
    supportsRateApi: [true, [Validators.required]],
    supportsWebhook: [true, [Validators.required]],
    supportsCod: [true, [Validators.required]],
    priorityOrder: [1, [Validators.required, Validators.min(1)]],
    active: [true, [Validators.required]]
  });
  initialData!: ICourierProvider;
  isEditMode = false;
  pageTitle = 'Create Courier Provider';
  authTypeOptions = [
    { value: 'API_KEY', label: 'API Key' },
    { value: 'JWT', label: 'JWT' },
    { value: 'BASIC', label: 'Basic Auth' }
  ];
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(CourierProvidersApiService);
  private snackBar = inject(MatSnackBar);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Courier Provider';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Courier Provider';
    }
    this.patchFormValues();
  }

  private patchFormValues(): void {
    if (this.initialData) {
      this.formGroup.patchValue({
        providerCode: this.initialData.providerCode || '',
        providerName: this.initialData.providerName || '',
        authType: this.initialData.authType || 'API_KEY',
        supportsRateApi: this.initialData.supportsRateApi !== undefined ? this.initialData.supportsRateApi : true,
        supportsWebhook: this.initialData.supportsWebhook !== undefined ? this.initialData.supportsWebhook : true,
        supportsCod: false,
        priorityOrder: this.initialData.priorityOrder || 1,
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

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageCourierProvider = this.formGroup.value;
      if (this.isEditMode && this.initialData) {
        const providerId = this.initialData.providerId;
        await this.apiService.update(providerId, formValue);
        this.snackBar.open('Courier provider updated successfully', 'Close', {
          duration: 3000,
        });
      } else {
        await this.apiService.create(formValue);
        this.snackBar.open('Courier provider created successfully', 'Close', {
          duration: 3000,
        });
      }
      this.router.navigate(['/delivery/courier-providers']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/delivery/courier-providers']);
  }

  ngOnDestroy(): void {
    // Component cleanup
  }
}

