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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AddressFormComponent, InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { AdminUserApiService } from '../api.service';
import {
  FileTypeEnum,
  IAdminUser,
  IDropdownItem,
  IManageAdminUser,
  IMediaUpload,
  InputLengthEnum
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-admin-user',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    InputErrorComponent,
    UploadFormComponent,
    AddressFormComponent
  ],
  templateUrl: './manage-admin-user.html',
  styleUrl: './manage-admin-user.scss'
})
export class ManageAdminUser implements OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    firstName: [
      '',
      [
        Validators.required,
        Validators.minLength(InputLengthEnum.MIN_NAME),
        Validators.maxLength(InputLengthEnum.CHAR_50)
      ]
    ],
    lastName: [
      '',
      [
        Validators.required,
        Validators.minLength(InputLengthEnum.MIN_NAME),
        Validators.maxLength(InputLengthEnum.CHAR_50)
      ]
    ],
    countryCode: ['', [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_5)]],
    contactNumber: [
      '',
      [
        Validators.required,
        Validators.minLength(InputLengthEnum.MIN_CONTACT_NUMBER),
        Validators.maxLength(InputLengthEnum.MAX_CONTACT_NUMBER)
      ]
    ],
    emailId: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(InputLengthEnum.MAX_EMAIL)
      ]
    ],
    startDate: [new Date(), [Validators.required]],
    endDate: [null],
    franchiseId: [null],
    active: [true, [Validators.required]],
    deactivationReason: ['', [Validators.maxLength(InputLengthEnum.CHAR_1000)]],
    password: ['', [Validators.minLength(InputLengthEnum.MIN_PASSWORD)]],
    roleIds: [[]]
  });
  initialData!: IAdminUser;
  isEditMode = false;
  pageTitle = 'Create Admin User';
  franchiseOptions: IDropdownItem[] = [];
  roleOptions: IDropdownItem[] = [];
  mediaFor = 'admin' as any; // Using string literal for MediaForEnum
  mediaType = FileTypeEnum.IMAGE;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(AdminUserApiService);
  private snackBar = inject(MatSnackBar);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    await this.loadMasterData();
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Admin User';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Admin User';
    }
    this.patchFormValues();
  }

  private patchFormValues(): void {
    if (this.initialData) {
      const startDate = this.initialData.startDate
        ? (typeof this.initialData.startDate === 'string' ? new Date(this.initialData.startDate) : this.initialData.startDate)
        : new Date();
      const endDate = this.initialData.endDate
        ? (typeof this.initialData.endDate === 'string' ? new Date(this.initialData.endDate) : this.initialData.endDate)
        : null;
      this.formGroup.patchValue({
        firstName: this.initialData.firstName || '',
        lastName: this.initialData.lastName || '',
        countryCode: this.initialData.countryCode || '',
        contactNumber: this.initialData.contactNumber || '',
        emailId: this.initialData.emailId || '',
        startDate: startDate,
        endDate: endDate,
        franchiseId: this.initialData.franchiseId || null,
        active: this.initialData.active !== undefined ? this.initialData.active : true,
        deactivationReason: this.initialData.deactivationReason || ''
      });
    }
  }

  async loadMasterData(): Promise<void> {
    try {
      // Load franchise and roles dropdowns
      this.franchiseOptions = await this.apiService.getFranchiseDropdown();
      // this.roleOptions = await this.apiService.getRoleDropdown();
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

  getProfilePicturePathList(): IMediaUpload[] {
    if (!this.initialData || !this.initialData.profilePicture) {
      return [];
    }
    const profilePicture = this.initialData.profilePicture;
    return Array.isArray(profilePicture) ? profilePicture : [];
  }

  getMaxLength(controlName: string): number | null {
    const maxLengthMap: { [key: string]: number } = {
      firstName: InputLengthEnum.CHAR_50,
      lastName: InputLengthEnum.CHAR_50,
      countryCode: InputLengthEnum.CHAR_5,
      contactNumber: InputLengthEnum.MAX_CONTACT_NUMBER,
      emailId: InputLengthEnum.MAX_EMAIL,
      deactivationReason: InputLengthEnum.CHAR_1000,
      password: InputLengthEnum.MAX_PASSWORD
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
      const formValue: IManageAdminUser = this.formGroup.value;
      // Handle setting picture from the upload form
      const profilePictureControl = this.formGroup.get('profilePicture');
      if (profilePictureControl) {
        const profilePictureValue = profilePictureControl.value;
        if (Array.isArray(profilePictureValue) && profilePictureValue.length > 0) {
          formValue.profilePicture = profilePictureValue;
        } else {
          formValue.profilePicture = undefined;
        }
      } else {
        formValue.profilePicture = undefined;
      }
      if (this.isEditMode && this.initialData) {
        const adminId = this.initialData.adminId;
        await this.apiService.update(adminId, formValue);
        this.snackBar.open('Admin user updated successfully', 'Close', {
          duration: 3000,
        });
      } else {
        await this.apiService.create(formValue);
        this.snackBar.open('Admin user created successfully', 'Close', {
          duration: 3000,
        });
      }
      this.router.navigate(['/admin-user']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin-user']);
  }

  ngOnDestroy(): void {
    // Component cleanup
  }
}
