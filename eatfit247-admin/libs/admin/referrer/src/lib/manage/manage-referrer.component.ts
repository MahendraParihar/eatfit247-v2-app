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
import { ReferrerApiService } from '../api.service';
import { FileTypeEnum, IDropdownItem, IManageReferrer, InputLengthEnum, IReferrer } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-referrer',
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
  templateUrl: './manage-referrer.html',
  styleUrl: './manage-referrer.scss'
})
export class ManageReferrer implements OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(InputLengthEnum.CHAR_2),
        Validators.maxLength(InputLengthEnum.CHAR_100)
      ]
    ],
    companyName: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
    websiteLink: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
    franchiseId: ['', [Validators.required]],
    emailId: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(InputLengthEnum.CHAR_50)
      ]
    ],
    alternateEmailId: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(InputLengthEnum.CHAR_100)
      ]
    ],
    contactNumber: [
      '',
      [
        Validators.required,
        Validators.maxLength(InputLengthEnum.MAX_CONTACT_NUMBER)
      ]
    ],
    alternateContactNumber: [
      '',
      [
        Validators.required,
        Validators.maxLength(InputLengthEnum.MAX_CONTACT_NUMBER)
      ]
    ],
    panNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_20)]],
    tanNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_20)]],
    gstNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
    startDate: [new Date()],
    endDate: [null],
    active: [true, [Validators.required]]
  });
  initialData!: IReferrer;
  isEditMode = false;
  pageTitle = 'Create Referrer';
  franchiseOptions: IDropdownItem[] = [];
  mediaFor = 'referrer' as any; // Using string literal
  mediaType = FileTypeEnum.IMAGE;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ReferrerApiService);
  private snackBar = inject(MatSnackBar);

  async ngOnInit(): Promise<void> {
    this.franchiseOptions = await this.apiService.getFranchiseDropdown();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Referrer';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Referrer';
    }
    this.patchFormValues();
  }

  private patchFormValues(): void {
    if (this.initialData) {
      const startDate = this.initialData.startDate
        ? typeof this.initialData.startDate === 'string'
          ? new Date(this.initialData.startDate)
          : this.initialData.startDate
        : new Date();
      const endDate = this.initialData.endDate
        ? typeof this.initialData.endDate === 'string'
          ? new Date(this.initialData.endDate)
          : this.initialData.endDate
        : null;
      this.formGroup.patchValue({
        name: this.initialData.name || '',
        companyName: this.initialData.companyName || '',
        websiteLink: this.initialData.websiteLink || '',
        franchiseId: this.initialData.franchiseId || '',
        emailId: this.initialData.emailId || '',
        alternateEmailId: this.initialData.alternateEmailId || '',
        contactNumber: this.initialData.contactNumber || '',
        alternateContactNumber: this.initialData.alternateContactNumber || '',
        panNumber: this.initialData.panNumber || '',
        tanNumber: this.initialData.tanNumber || '',
        gstNumber: this.initialData.gstNumber || '',
        startDate: startDate,
        endDate: endDate,
        active:
          this.initialData.active !== undefined
            ? this.initialData.active
            : true
      });
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch (error) {
      this.snackBar.open('Failed to load referrer. Please try again.', 'Close', {
        duration: 5000,
      });
      this.router.navigate(['/referrer']);
    }
  }

  getLogoPathList(): any[] {
    if (!this.initialData || !(this.initialData as any).imagePath) {
      return [];
    }
    const imagePath = (this.initialData as any).imagePath;
    return Array.isArray(imagePath) ? imagePath : [];
  }

  getMaxLength(controlName: string): number | null {
    const maxLengthMap: { [key: string]: number } = {
      name: InputLengthEnum.CHAR_100,
      companyName: InputLengthEnum.CHAR_100,
      websiteLink: InputLengthEnum.CHAR_100,
      emailId: InputLengthEnum.CHAR_50,
      alternateEmailId: InputLengthEnum.CHAR_100,
      contactNumber: InputLengthEnum.MAX_CONTACT_NUMBER,
      alternateContactNumber: InputLengthEnum.MAX_CONTACT_NUMBER,
      panNumber: InputLengthEnum.CHAR_20,
      tanNumber: InputLengthEnum.CHAR_20,
      gstNumber: InputLengthEnum.CHAR_50
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
      const formValue: IManageReferrer = this.formGroup.value;
      // Handle logo from the upload form
      const logoControl = this.formGroup.get('logo');
      if (logoControl) {
        const logoValue = logoControl.value;
        if (Array.isArray(logoValue) && logoValue.length > 0) {
          formValue.logo = logoValue;
        } else {
          formValue.logo = undefined;
        }
      } else {
        formValue.logo = undefined;
      }
      try {
        if (this.isEditMode && this.initialData) {
          const referrerId = this.initialData.referrerId;
          await this.apiService.update(referrerId, formValue);
          this.snackBar.open('Referrer updated successfully', 'Close', {
            duration: 3000,
          });
        } else {
          await this.apiService.create(formValue);
          this.snackBar.open('Referrer created successfully', 'Close', {
            duration: 3000,
          });
        }
        this.router.navigate(['/referrer']);
      } catch (error) {
        // Error toast is handled by HttpErrorInterceptor
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/referrer']);
  }

  ngOnDestroy(): void {
    // Component cleanup
  }
}
