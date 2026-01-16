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
import { InputErrorComponent, ValidationUtil } from '@shared';
import { LovMasterApiService } from '../../api.service';
import { IDropdownItem, IManageState, InputLengthEnum, IState } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-state',
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
    InputErrorComponent
  ],
  templateUrl: './manage-state.html',
  styleUrl: './manage-state.scss'
})
export class ManageState implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    state: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_100)]],
    code: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_10)]],
    countryId: [null, [Validators.required]],
    taxPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    active: [true, [Validators.required]]
  });
  initialData!: IState;
  countryOptions: IDropdownItem[] = [];
  isEditMode = false;
  pageTitle = 'Create State';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: LovMasterApiService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadCountryOptions();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit State';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create State';
    }
    this.buildForm();
  }

  private async loadCountryOptions(): Promise<void> {
    this.countryOptions = await this.apiService.getCountryDropdown();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      state: [
        this.initialData?.state || '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.CHAR_2),
          Validators.maxLength(InputLengthEnum.CHAR_50)
        ]
      ],
      code: [
        this.initialData?.code || '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.CHAR_2),
          Validators.maxLength(InputLengthEnum.CHAR_10)
        ]
      ],
      countryId: [this.initialData?.countryId || null, [Validators.required]],
      taxPercentage: [this.initialData?.taxPercentage || 0, [Validators.required, Validators.min(0), Validators.max(100)]],
      active: [this.initialData?.active !== undefined ? this.initialData.active : true]
    });
  }

  async loadData(id: number): Promise<void> {
    this.initialData = await this.apiService.getStateById(id);
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (this.formGroup.valid) {
      const formValue: IManageState = { ...this.formGroup.value };
      if (this.isEditMode && this.initialData) {
        formValue.stateId = this.initialData.stateId;
        await this.apiService.updateState(this.initialData.stateId, formValue);
      } else {
        await this.apiService.createState(formValue);
      }
      this.router.navigate(['/lov-master/state']);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/lov-master/state']);
  }
}
