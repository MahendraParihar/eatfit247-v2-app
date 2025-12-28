import { Component, Inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { InputErrorComponent } from '@shared';
import {
  IHealthParameterMaster,
  IManageMemberHealthParameterLog,
  IBasicMemberHealthParameter,
  IDropdownItem,
  InputLengthEnum,
} from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';

export interface ManageMemberBodyStatsData {
  memberId: number;
}

@Component({
  selector: 'lib-manage-member-body-stats',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    InputErrorComponent,
  ],
  templateUrl: './manage-member-body-stats.component.html',
  styleUrl: './manage-member-body-stats.component.scss',
})
export class ManageMemberBodyStatsComponent implements OnInit {
  formGroup!: FormGroup;
  masterData = signal<IHealthParameterMaster | null>(null);
  loading = signal(false);
  submitting = signal(false);
  displayedColumns: string[] = ['healthParameter', 'value', 'unit', 'actions'];
  InputLengthEnum = InputLengthEnum;
  
  // Signal to track FormArray changes
  private formArrayUpdateTrigger = signal(0);

  // Computed signal for form array controls
  healthParametersControls = computed(() => {
    // Access the trigger to make this reactive
    this.formArrayUpdateTrigger();
    return this.healthParametersFormArray.controls;
  });

  constructor(
    public dialogRef: MatDialogRef<ManageMemberBodyStatsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ManageMemberBodyStatsData,
    private apiService: MembersApiService,
    private fb: FormBuilder,
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadMasterData();
  }

  private initializeForm(): void {
    this.formGroup = this.fb.group({
      logDate: [new Date(), [Validators.required]],
      healthParameters: this.fb.array([]),
    });
  }

  get healthParametersFormArray(): FormArray {
    return this.formGroup.get('healthParameters') as FormArray;
  }

  async loadMasterData(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.apiService.getHealthParameterMasterData(this.data.memberId);
      this.masterData.set(data);
      // Add one empty row by default
      this.addHealthParameterRow();
    } catch (error) {
      console.error('Error loading master data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  addHealthParameterRow(): void {
    const healthParameterForm = this.fb.group({
      healthParameterId: [null, [Validators.required]],
      value: ['', [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_20)]],
      healthParameterUnitId: [null, [Validators.required]],
    });
    this.healthParametersFormArray.push(healthParameterForm);
    // Trigger signal update to refresh computed
    this.formArrayUpdateTrigger.update(v => v + 1);
  }

  removeHealthParameterRow(index: number): void {
    if (this.healthParametersFormArray.length > 1) {
      this.healthParametersFormArray.removeAt(index);
      // Trigger signal update to refresh computed
      this.formArrayUpdateTrigger.update(v => v + 1);
    }
  }

  getHealthParameterName(healthParameterId: number): string {
    const data = this.masterData();
    if (!data) return '';
    const param = data.healthParameters.find((p) => p.id === healthParameterId);
    return param?.label || '';
  }

  getFilteredUnits(healthParameterId: number | null): IDropdownItem[] {
    const data = this.masterData();
    if (!healthParameterId || !data) return data?.healthParameterUnits || [];
    // For now, return all units. You can filter based on health parameter if needed
    return data.healthParameterUnits || [];
  }

  trackByIndex(index: number): number {
    return index;
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.valid && this.healthParametersFormArray.length > 0) {
      this.submitting.set(true);
      try {
        const formValue = this.formGroup.value;
        const logDate = formValue.logDate instanceof Date 
          ? formValue.logDate 
          : new Date(formValue.logDate);
        
        const data: IManageMemberHealthParameterLog = {
          memberId: this.data.memberId,
          logDate: logDate,
          healthParameters: formValue.healthParameters.map((param: any) => ({
            healthParameterId: param.healthParameterId,
            value: param.value,
            healthParameterUnitId: param.healthParameterUnitId,
          })),
        };

        await this.apiService.createHealthParameterLog(this.data.memberId, data);
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error saving health parameter log:', error);
      } finally {
        this.submitting.set(false);
      }
    } else {
      // Mark all fields as touched to show validation errors
      this.formGroup.markAllAsTouched();
      this.healthParametersFormArray.controls.forEach((control) => {
        control.markAllAsTouched();
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
