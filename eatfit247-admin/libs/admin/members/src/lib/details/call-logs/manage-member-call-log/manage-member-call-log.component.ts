import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { InputErrorComponent, LoaderComponent } from '@shared';
import { IAvailableSlot, ICallLogSlot, IDropdownItem, ISetupMemberCallLog } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';
import moment from 'moment';

@Component({
  selector: 'lib-manage-member-call-log',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatCheckboxModule,
    MatStepperModule,
    InputErrorComponent,
    LoaderComponent,
  ],
  templateUrl: './manage-member-call-log.component.html',
  styleUrl: './manage-member-call-log.component.scss',
})
export class ManageMemberCallLogComponent implements OnInit {
  // Stepper control
  selectedIndex = signal(0);
  // Form for Step 1
  criteriaFormGroup!: FormGroup;
  loading = signal(false);
  checkingAvailability = signal(false);
  submitting = signal(false);
  // Master data
  callTypeOptions: IDropdownItem[] = [];
  callPurposeOptions: IDropdownItem[] = [];
  callLogStatusOptions: IDropdownItem[] = [];
  nutritionistOptions: IDropdownItem[] = [];
  durationOptions: IDropdownItem[] = [];
  // Step 2: Available time slots
  slots: ICallLogSlot[] = [];
  selectedSlot: ICallLogSlot | null = null;
  // Step 3: Confirmation form data
  form = {
    callTypeId: null as number | null,
    callPurposeId: null as number | null,
    notifyUser: false,
  };

  constructor(
    public dialogRef: MatDialogRef<ManageMemberCallLogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: number,
    private apiService: MembersApiService,
    private fb: FormBuilder,
  ) {
    this.initializeCriteriaForm();
  }

  ngOnInit(): void {
    this.loadMasterData();
  }

  private initializeCriteriaForm(): void {
    this.criteriaFormGroup = this.fb.group({
      nutritionistId: [null, [Validators.required]],
      duration: [null, [Validators.required]],
      dateFrom: [new Date(), [Validators.required]],
      dateTo: [null, [Validators.required]],
    });
  }

  async loadMasterData(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.apiService.getCallLogMasterData(this.data);
      this.callLogStatusOptions = data.callLogStatuses;
      this.callTypeOptions = data.callTypes;
      this.callPurposeOptions = data.callPurposes;
      this.nutritionistOptions = data.nutritionists;
      this.durationOptions = data.durations;
    } catch (error) {
      console.error('Error loading master data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async checkAvailability(): Promise<void> {
    if (this.criteriaFormGroup.invalid) {
      this.criteriaFormGroup.markAllAsTouched();
      return;
    }
    this.checkingAvailability.set(true);
    try {
      const formValue = this.criteriaFormGroup.value;
      // Format dates as date-only strings (YYYY-MM-DD) to avoid UTC timezone conversion
      // When Date objects are serialized to JSON, they become UTC ISO strings which shifts the date
      const formatDateForAPI = (date: Date | string | null): string => {
        if (!date) {
          return moment().format('YYYY-MM-DD');
        }
        // Convert to Date object if it's a string
        const dateObj = date instanceof Date ? date : new Date(date);
        // Check if the date is valid
        if (isNaN(dateObj.getTime())) {
          return moment().format('YYYY-MM-DD');
        }
        // Use moment to format the date, preserving the local date components
        // This prevents timezone shift when serialized to JSON
        return moment(dateObj).format('YYYY-MM-DD');
      };
      // Prepare request data
      const availableSlotRequest: IAvailableSlot = {
        nutritionistId: formValue.nutritionistId,
        fromDate: formatDateForAPI(formValue.dateFrom),
        toDate: formatDateForAPI(formValue.dateTo || formValue.dateFrom),
        duration: formValue.duration,
      };
      // Call API to get available time slots
      this.slots = await this.apiService.getAvailableTimeslots(
        this.data,
        availableSlotRequest,
      );
      // After checking availability, proceed to next step
      if (this.slots.length > 0) {
        this.selectedIndex.set(1);
      } else {
        // Show a message that no slots are available
        console.warn('No available slots found');
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      this.slots = [];
    } finally {
      this.checkingAvailability.set(false);
    }
  }

  // Step Navigation Methods
  nextStep(): void {
    const current = this.selectedIndex();
    if (current < 2) {
      this.selectedIndex.set(current + 1);
    }
  }

  previousStep(): void {
    const current = this.selectedIndex();
    if (current > 0) {
      this.selectedIndex.set(current - 1);
    }
  }

  goToConfirm(): void {
    if (this.selectedSlot) {
      this.selectedIndex.set(2);
    }
  }

  async confirmBooking(): Promise<void> {
    if (!this.selectedSlot || !this.form.callTypeId) {
      return;
    }
    this.submitting.set(true);
    try {
      // Prepare call log data
      const criteriaValue = this.criteriaFormGroup.value;
      const callLogData = <ISetupMemberCallLog>{
        memberId: this.data,
        startTime: this.selectedSlot.start,
        endTime: this.selectedSlot.end,
        callTypeId: this.form.callTypeId,
        callPurposeId: this.form.callPurposeId,
        nutritionistId: criteriaValue.nutritionistId,
        notifyUser: this.form.notifyUser,
      };
      await this.apiService.createCallLog(this.data, callLogData as any);
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error confirming booking:', error);
    } finally {
      this.submitting.set(false);
    }
  }

  onStepperSelectionChange(event: StepperSelectionEvent): void {
    this.selectedIndex.set(event.selectedIndex);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
