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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AddressFormComponent, InputErrorComponent, UploadFormComponent, ValidationUtil } from '@shared';
import { FranchiseApiService } from '../api.service';
import {
  BusinessTypeEnum,
  CommonUtil,
  FileTypeEnum,
  IFranchise,
  IManageFranchise,
  InputLengthEnum,
  InternationalTaxModeEnum
} from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-franchise',
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
    InputErrorComponent,
    UploadFormComponent,
    AddressFormComponent
  ],
  templateUrl: './manage-franchise.html',
  styleUrl: './manage-franchise.scss'
})
export class ManageFranchise implements OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    franchiseCode: [
      '',
      [
        Validators.required,
        Validators.minLength(InputLengthEnum.CHAR_2),
        Validators.maxLength(InputLengthEnum.CHAR_10)
      ]
    ],
    financialYear: [
      null,
      [
        Validators.required
      ]
    ],
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
    companyName: [
      '',
      [
        Validators.required,
        Validators.minLength(InputLengthEnum.CHAR_2),
        Validators.maxLength(InputLengthEnum.CHAR_100)
      ]
    ],
    emailId: ['', [Validators.required, Validators.email, Validators.maxLength(InputLengthEnum.MAX_EMAIL)]],
    alternateEmailId: ['', [Validators.required, Validators.email, Validators.maxLength(InputLengthEnum.MAX_EMAIL)]],
    contactNumber: ['', [Validators.required, Validators.maxLength(InputLengthEnum.MAX_CONTACT_NUMBER)]],
    alternateContactNumber: ['', [Validators.required, Validators.maxLength(InputLengthEnum.MAX_CONTACT_NUMBER)]],
    panNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_20)]],
    tanNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_20)]],
    gstNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_50)]],
    vatNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
    bankAccountId: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
    paymentGatewayConfigId: [null],
    brandName: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
    lutNumber: ['', [Validators.maxLength(InputLengthEnum.CHAR_100)]],
    internationalTaxMode: [null],
    startDate: [new Date(), [Validators.required]],
    endDate: [null],
    isPrimary: [false, [Validators.required]],
    isDefault: [false, [Validators.required]],
    businessType: [[]],
    active: [true, [Validators.required]]
  });
  initialData!: IFranchise;
  isEditMode = false;
  pageTitle = 'Create Franchise';
  mediaFor = 'franchise' as any; // Using string literal
  mediaType = FileTypeEnum.IMAGE;
  internationalTaxModeOptions = InternationalTaxModeEnum;
  businessTypeOptions = BusinessTypeEnum;
  masterData: { taxApplicable: boolean } | null = null;
  financialYearOptions: { value: number; label: string }[] = [];

  private initializeFinancialYearOptions(): void {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.financialYearOptions = Array.from({ length: 12 }, (_, i) => {
      const startMonth = months[i];
      const endMonth = months[(i + 11) % 12];
      return {
        value: i + 1,
        label: `${startMonth} to ${endMonth}`
      };
    });
  }
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(FranchiseApiService);
  private snackBar = inject(MatSnackBar);

  async ngOnInit(): Promise<void> {
    this.initializeFinancialYearOptions();
    const id = this.route.snapshot.paramMap.get('id');
    await this.loadMasterData();
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Franchise';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Franchise';
    }
    this.patchFormValues();
    // Set dropdown based on master data after patching form values
    this.setInternationalTaxModeFromMasterData();
  }

  private patchFormValues(): void {
    if (this.initialData) {
      const startDate = this.initialData.startDate
        ? new Date(this.initialData.startDate)
        : new Date();
      const endDate = this.initialData.endDate ? new Date(this.initialData.endDate) : null;
      this.formGroup.patchValue({
        franchiseCode: (this.initialData as any).franchiseCode || '',
        financialYear: (this.initialData as any).financialYear || null,
        firstName: this.initialData.firstName || '',
        lastName: this.initialData.lastName || '',
        companyName: this.initialData.companyName || '',
        emailId: this.initialData.emailId || '',
        alternateEmailId: this.initialData.alternateEmailId || '',
        contactNumber: this.initialData.contactNumber || '',
        alternateContactNumber: this.initialData.alternateContactNumber || '',
        panNumber: this.initialData.panNumber || '',
        tanNumber: this.initialData.tanNumber || '',
        gstNumber: this.initialData.gstNumber || '',
        vatNumber: (this.initialData as any).vatNumber || '',
        bankAccountId: (this.initialData as any).bankAccountId || '',
        paymentGatewayConfigId: (this.initialData as any).paymentGatewayConfigId || null,
        brandName: (this.initialData as any).brandName || '',
        lutNumber: (this.initialData as any).lutNumber || '',
        internationalTaxMode: (this.initialData as any).internationalTaxMode || null,
        startDate: startDate,
        endDate: endDate,
        isPrimary: (this.initialData as any).isPrimary !== undefined ? (this.initialData as any).isPrimary : false,
        isDefault: (this.initialData as any).isDefault !== undefined ? (this.initialData as any).isDefault : false,
        businessType: (this.initialData as any).businessType || [],
        active: this.initialData.active !== undefined ? this.initialData.active : true
      });
      
      // Address will be bound by AddressFormComponent when address input is set
    }
  }

  async loadMasterData(): Promise<void> {
    try {
      this.masterData = await this.apiService.getMasterData();
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  private setInternationalTaxModeFromMasterData(): void {
    // Set internationalTaxMode dropdown based on taxApplicable from master data
    if (this.masterData?.taxApplicable === true) {
      // Set default value when tax is applicable, only if field is empty
      const currentValue = this.formGroup.get('internationalTaxMode')?.value;
      if (!currentValue) {
        this.formGroup.patchValue({
          internationalTaxMode: InternationalTaxModeEnum.EXPORT_OF_SERVICE
        });
      }
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
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
      franchiseCode: InputLengthEnum.CHAR_10,
      firstName: InputLengthEnum.CHAR_50,
      lastName: InputLengthEnum.CHAR_50,
      companyName: InputLengthEnum.CHAR_100,
      emailId: InputLengthEnum.MAX_EMAIL,
      alternateEmailId: InputLengthEnum.MAX_EMAIL,
      contactNumber: InputLengthEnum.MAX_CONTACT_NUMBER,
      alternateContactNumber: InputLengthEnum.MAX_CONTACT_NUMBER,
      panNumber: InputLengthEnum.CHAR_20,
      tanNumber: InputLengthEnum.CHAR_20,
      gstNumber: InputLengthEnum.CHAR_50,
      vatNumber: InputLengthEnum.CHAR_100,
      bankAccountId: InputLengthEnum.CHAR_100,
      brandName: InputLengthEnum.CHAR_100,
      lutNumber: InputLengthEnum.CHAR_100
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
      const formValue: any = { ...this.formGroup.value };
      // Format dates to avoid timezone conversion issues
      formValue.startDate = CommonUtil.formatDateForAPI(formValue.startDate) || undefined;
      formValue.endDate = CommonUtil.formatDateForAPI(formValue.endDate) || undefined;
      
      // Handle logo from upload form
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
      
      // Handle address from address form - addressObj is already in formValue from formGroup.value
      const addressObjControl = this.formGroup.get('addressObj');
      if (addressObjControl && addressObjControl.valid) {
        const addressValue = addressObjControl.value;
        if (addressValue.postalAddress && addressValue.countryId && addressValue.stateId) {
          formValue.addressObj = addressValue;
        } else {
          formValue.addressObj = undefined;
        }
      } else {
        formValue.addressObj = undefined;
      }
      
      if (this.isEditMode && this.initialData) {
        const franchiseId = (this.initialData as any).franchiseId;
        await this.apiService.update(franchiseId, formValue);
        this.snackBar.open('Franchise updated successfully', 'Close', {
          duration: 3000,
        });
      } else {
        await this.apiService.create(formValue);
        this.snackBar.open('Franchise created successfully', 'Close', {
          duration: 3000,
        });
      }
      this.router.navigate(['/franchise']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/franchise']);
  }

  ngOnDestroy(): void {
    // Component cleanup
  }
}
