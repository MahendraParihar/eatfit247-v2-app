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
import { HealthParameterUnitApiService } from '../../api.service';
import { IHealthParameterUnit, IManageHealthParameterUnit, InputLengthEnum } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-manage-health-parameter-unit',
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
  templateUrl: './manage-health-parameter-unit.html',
  styleUrl: './manage-health-parameter-unit.scss'
})
export class ManageHealthParameterUnit implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(HealthParameterUnitApiService);

  private fb: FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({
    healthParameterUnit: ['', [Validators.required, Validators.minLength(InputLengthEnum.CHAR_2), Validators.maxLength(InputLengthEnum.CHAR_50)]],
    active: [true, [Validators.required]]
  });
  initialData!: IHealthParameterUnit;
  isEditMode = false;
  pageTitle = 'Create Health Parameter Unit';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Health Parameter Unit';
      await this.loadData(+id);
    } else {
      this.pageTitle = 'Create Health Parameter Unit';
    }
    this.buildForm();
  }

  private buildForm(): void {
    this.formGroup = this.fb.group({
      healthParameterUnit: [
        this.initialData?.healthParameterUnit || '',
        [
          Validators.required,
          Validators.minLength(InputLengthEnum.CHAR_2),
          Validators.maxLength(InputLengthEnum.CHAR_50)
        ]
      ],
      active: [this.initialData?.active !== undefined ? this.initialData.active : true]
    });
  }

  async loadData(id: number): Promise<void> {
    this.initialData = await this.apiService.getById(id);
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.invalid) {
      ValidationUtil.validateAllFormFields(this.formGroup);
      return;
    }
    const formValue: IManageHealthParameterUnit = this.formGroup.value;
    if (this.isEditMode && this.initialData) {
      formValue.healthParameterUnitId = this.initialData.healthParameterUnitId;
      await this.apiService.update(this.initialData.healthParameterUnitId, formValue);
    } else {
      await this.apiService.create(formValue);
    }
    this.router.navigate(['/lov-master/health-parameter-unit']);
  }

  goBack(): void {
    this.router.navigate(['/lov-master/health-parameter-unit']);
  }
}
