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
import { MembersApiService } from '../api.service';
import {
  IMember,
  IManageMember,
  InputLengthEnum,
  IDropdownItem,
  FileTypeEnum,
  IMediaUpload
} from '@eatfit247-shared-lib';
import { LovMasterApiService } from '../../lov-master/src/lib/api.service';

@Component({
  selector: 'lib-manage-member',
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
  templateUrl: './manage-member.html',
  styleUrl: './manage-member.scss'
})
export class ManageMember implements OnInit, OnDestroy {
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
    franchiseId: ['', [Validators.required]],
    countryId: ['', [Validators.required]],
    referrerId: [null],
    nutritionistId: [null],
    active: [true, [Validators.required]],
    deactivationReason: ['', [Validators.maxLength(InputLengthEnum.CHAR_1000)]],
    hasAnyPlan: [false],
    password: ['', [Validators.minLength(InputLengthEnum.MIN_PASSWORD)]]
  });
  initialData!: IMember;
  isEditMode = false;
  pageTitle = 'Create Member';
  franchiseOptions: IDropdownItem[] = [];
  countryOptions: IDropdownItem[] = [];
  referrerOptions: IDropdownItem[] = [];
  nutritionistOptions: IDropdownItem[] = [];
  mediaFor = 'member' as any;
  mediaType = FileTypeEnum.IMAGE;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(MembersApiService);
  private lovMasterApiService = inject(LovMasterApiService);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    await this.loadMasterData();
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Member';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Member';
    }
    this.patchFormValues();
  }

  private patchFormValues(): void {
    if (this.initialData) {
      this.formGroup.patchValue({
        firstName: this.initialData.firstName || '',
        lastName: this.initialData.lastName || '',
        countryCode: this.initialData.countryCode || '',
        contactNumber: this.initialData.contactNumber || '',
        emailId: this.initialData.emailId || '',
        franchiseId: this.initialData.franchiseId || '',
        countryId: this.initialData.countryId || '',
        referrerId: this.initialData.referrerId || null,
        nutritionistId: this.initialData.nutritionistId || null,
        active: this.initialData.active !== undefined ? this.initialData.active : true,
        deactivationReason: this.initialData.deactivationReason || '',
        hasAnyPlan: this.initialData.hasAnyPlan !== undefined ? this.initialData.hasAnyPlan : false
      });
    }
  }

  async loadMasterData(): Promise<void> {
    try {
      this.countryOptions = await this.lovMasterApiService.getCountryDropdown();
      this.franchiseOptions = await this.apiService.getFranchiseDropdown();
      // Load referrer dropdown if endpoint exists
      try {
        this.referrerOptions = await this.apiService.getReferrerDropdown();
      } catch (error) {
        console.warn('Referrer dropdown not available:', error);
      }
      // Load nutritionist dropdown if endpoint exists
      try {
        this.nutritionistOptions = await this.apiService.getNutritionistDropdown();
      } catch (error) {
        console.warn('Nutritionist dropdown not available:', error);
      }
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  }

  async loadData(id: number): Promise<void> {
    try {
      this.initialData = await this.apiService.getById(id);
    } catch (error) {
      console.error('Error loading member:', error);
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
      const formValue: IManageMember = this.formGroup.value;
      // Handle profile picture from the upload form
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
      // Handle password - only send if provided (for create) or if changing (for update)
      if (!formValue.password || formValue.password === '') {
        delete formValue.password;
      }
      if (this.isEditMode && this.initialData) {
        const memberId = this.initialData.memberId;
        await this.apiService.update(memberId, formValue);
      } else {
        await this.apiService.create(formValue);
      }
      this.router.navigate(['/members']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/members']);
  }

  ngOnDestroy(): void {
    // Component cleanup
  }
}
