import { Component, computed, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputErrorComponent } from '@shared';
import {
  IDropdownItem,
  IHealthParameterMaster,
  IManageMemberHealthParameterLog,
  IMemberHealthParameterLog,
  InputLengthEnum
} from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';

export interface ManageMemberBodyStatsData {
  memberId: number;
  log?: IMemberHealthParameterLog;
}

@Component({
  selector: 'lib-manage-member-body-stats',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule,
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
  InputLengthEnum = InputLengthEnum;
  
  // Signal to track FormArray changes
  private formArrayUpdateTrigger = signal(0);

  // Computed signal for form array controls
  healthParametersControls = computed<FormGroup[]>(() => {
    // Access the trigger to make this reactive
    this.formArrayUpdateTrigger();
    return this.healthParametersFormArray.controls as FormGroup[];
  });

  constructor(
    public dialogRef: MatDialogRef<ManageMemberBodyStatsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ManageMemberBodyStatsData,
    private apiService: MembersApiService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadMasterData();
  }

  private initializeForm(): void {
    const logDate = this.data.log?.logDate 
      ? (this.data.log.logDate instanceof Date ? this.data.log.logDate : new Date(this.data.log.logDate))
      : new Date();

    this.formGroup = this.fb.group({
      logDate: [logDate, [Validators.required]],
      healthParameters: this.fb.array([]),
    });

    // If editing, populate form with existing data
    if (this.data.log) {
      this.populateFormForEdit();
    }
  }

  private populateFormForEdit(): void {
    if (!this.data.log || !this.data.log.healthParameters) {
      return;
    }

    // Clear existing form array
    while (this.healthParametersFormArray.length !== 0) {
      this.healthParametersFormArray.removeAt(0);
    }

    // Add form controls for each health parameter
    this.data.log.healthParameters.forEach((param) => {
      const healthParameterForm = this.fb.group({
        healthParameterId: [param.healthParameterId, [Validators.required]],
        value: [param.value, [Validators.required, Validators.maxLength(InputLengthEnum.CHAR_20)]],
        healthParameterUnitId: [param.healthParameterUnitId, [Validators.required]],
      });
      
      // Subscribe to health parameter changes to reset unit when parameter changes
      healthParameterForm.get('healthParameterId')?.valueChanges.subscribe(() => {
        healthParameterForm.patchValue({ healthParameterUnitId: null }, { emitEvent: false });
      });
      
      this.healthParametersFormArray.push(healthParameterForm);
    });

    this.formArrayUpdateTrigger.update(v => v + 1);
  }

  get healthParametersFormArray(): FormArray {
    return this.formGroup.get('healthParameters') as FormArray;
  }

  async loadMasterData(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.apiService.getHealthParameterMasterData(this.data.memberId);
      this.masterData.set(data);
      // Only add empty row if not editing
      if (!this.data.log && this.healthParametersFormArray.length === 0) {
        this.addHealthParameterRow();
      }
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
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
    
    // Subscribe to health parameter changes to reset unit when parameter changes
    healthParameterForm.get('healthParameterId')?.valueChanges.subscribe(() => {
      healthParameterForm.patchValue({ healthParameterUnitId: null }, { emitEvent: false });
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
    } else {
      // If only one row, clear its values instead of removing
      const control = this.healthParametersFormArray.at(index);
      control.patchValue({
        healthParameterId: null,
        value: '',
        healthParameterUnitId: null,
      });
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
          healthParameters: formValue.healthParameters.map((param: { healthParameterId: number; value: string; healthParameterUnitId: number }) => ({
            healthParameterId: param.healthParameterId,
            value: param.value,
            healthParameterUnitId: param.healthParameterUnitId,
          })),
        };

        if (this.data.log) {
          // Update existing log
          data.memberHealthParameterLogId = this.data.log.memberHealthParameterLogId;
          await this.apiService.updateHealthParameterLog(
            this.data.memberId,
            this.data.log.memberHealthParameterLogId,
            data
          );
        } else {
          // Create new log
          await this.apiService.createHealthParameterLog(this.data.memberId, data);
        }
        this.snackBar.open(
          this.data.log ? 'Health parameter log updated successfully' : 'Health parameter log created successfully',
          'Close',
          { duration: 3000 }
        );
        this.dialogRef.close(true);
      } catch (error) {
        // Error toast is handled by HttpErrorInterceptor
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
