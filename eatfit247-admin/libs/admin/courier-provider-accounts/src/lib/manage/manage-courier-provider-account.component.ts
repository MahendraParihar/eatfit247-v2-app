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
import { CourierProviderAccountsApiService } from '../api.service';
import { ICourierProviderAccount, IDropdownItem, IManageCourierProviderAccount, InputLengthEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-courier-provider-account',
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
  templateUrl: './manage-courier-provider-account.html',
  styleUrl: './manage-courier-provider-account.scss'
})
export class ManageCourierProviderAccount implements OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    providerId: [null, [Validators.required]],
    franchiseId: [null, [Validators.required]],
    accountName: ['', [Validators.maxLength(100)]],
    apiBaseUrl: ['', [Validators.required]],
    apiKey: [''],
    apiSecret: [''],
    username: [''],
    password: [''],
    authToken: [''],
    tokenExpiry: [null],
    webhookSecret: [''],
    active: [true, [Validators.required]]
  });
  initialData!: ICourierProviderAccount;
  isEditMode = false;
  pageTitle = 'Create Courier Provider Account';
  providerOptions: IDropdownItem[] = [];
  franchiseOptions: IDropdownItem[] = [];
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(CourierProviderAccountsApiService);
  private snackBar = inject(MatSnackBar);

  async ngOnInit(): Promise<void> {
    await this.loadMasterData();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Courier Provider Account';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Courier Provider Account';
    }
    this.patchFormValues();
  }

  private patchFormValues(): void {
    if (this.initialData) {
      this.formGroup.patchValue({
        providerId: this.initialData.providerId || null,
        franchiseId: this.initialData.franchiseId || null,
        accountName: this.initialData.accountName || '',
        apiBaseUrl: this.initialData.apiBaseUrl || '',
        apiKey: this.initialData.apiKey || '',
        apiSecret: this.initialData.apiSecret || '',
        username: this.initialData.username || '',
        authToken: this.initialData.authToken || '',
        tokenExpiry: this.initialData.tokenExpiry || null,
        webhookSecret: this.initialData.webhookSecret || '',
        active: this.initialData.active !== undefined ? this.initialData.active : true
      });
      // Don't populate password field
    }
  }

  async loadMasterData(): Promise<void> {
    try {
      this.providerOptions = await this.apiService.getCourierProviderDropdown();
      this.franchiseOptions = await this.apiService.getFranchiseDropdown();
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
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
      const formValue: IManageCourierProviderAccount = this.formGroup.value;
      // Only include password if it's provided (for updates, leave empty to keep existing)
      if (!formValue.password || formValue.password.trim() === '') {
        delete formValue.password;
      }
      if (this.isEditMode && this.initialData) {
        const accountId = this.initialData.providerAccountId;
        await this.apiService.update(accountId, formValue);
        this.snackBar.open('Courier provider account updated successfully', 'Close', {
          duration: 3000,
        });
      } else {
        await this.apiService.create(formValue);
        this.snackBar.open('Courier provider account created successfully', 'Close', {
          duration: 3000,
        });
      }
      this.router.navigate(['/delivery/courier-provider-accounts']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/delivery/courier-provider-accounts']);
  }

  ngOnDestroy(): void {
    // Component cleanup
  }
}

