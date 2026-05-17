import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AppointmentApiService, IAppointment, INutritionist } from '../api.service';

const STATUS_OPTIONS = [
  { value: 1, label: 'Scheduled' },
  { value: 2, label: 'Confirmed' },
  { value: 3, label: 'Completed' },
  { value: 4, label: 'Cancelled' },
  { value: 5, label: 'No Show' },
];

@Component({
  selector: 'lib-manage-appointment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './manage-appointment.component.html',
  styleUrl: './manage-appointment.component.scss',
})
export class ManageAppointment implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private apiService = inject(AppointmentApiService);

  pageTitle = 'Book Appointment';
  isEditMode = false;
  loading = false;
  saving = false;
  appointmentId: number | null = null;
  nutritionists: INutritionist[] = [];
  statusOptions = STATUS_OPTIONS;
  form!: FormGroup;
  minDate = new Date();

  ngOnInit(): void {
    this.initForm();
    this.loadNutritionists();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.appointmentId = +id;
      this.pageTitle = 'Edit Appointment';
      this.loadAppointment(this.appointmentId);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      assignedAdminId: [null, Validators.required],
      appointmentDate: [null, Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      appointmentType: [1, Validators.required],
      contactFormId: [null],
      memberId: [null],
      guestName: ['', Validators.maxLength(100)],
      guestEmail: ['', [Validators.email, Validators.maxLength(100)]],
      guestPhone: ['', Validators.maxLength(25)],
      notes: [''],
      status: [1],
      cancellationReason: ['', Validators.maxLength(500)],
    });
  }

  private async loadNutritionists(): Promise<void> {
    try {
      this.nutritionists = await this.apiService.getNutritionists();
    } catch {
      // Error handled by interceptor
    }
  }

  private async loadAppointment(id: number): Promise<void> {
    this.loading = true;
    try {
      const appointment: IAppointment = await this.apiService.getById(id);
      this.form.patchValue({
        assignedAdminId: appointment.assignedAdminId,
        appointmentDate: new Date(appointment.appointmentDate),
        startTime: appointment.startTime?.substring(0, 5),
        endTime: appointment.endTime?.substring(0, 5),
        appointmentType: appointment.appointmentType,
        contactFormId: appointment.contactFormId,
        memberId: appointment.memberId,
        guestName: appointment.guestName || '',
        guestEmail: appointment.guestEmail || '',
        guestPhone: appointment.guestPhone || '',
        notes: appointment.notes || '',
        status: appointment.status,
        cancellationReason: appointment.cancellationReason || '',
      });
      this.loading = false;
    } catch {
      this.loading = false;
      this.router.navigate(['/appointments']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    const formValue = this.form.value;

    // Format date to YYYY-MM-DD
    const appointmentDate = formValue.appointmentDate instanceof Date
      ? formValue.appointmentDate.toISOString().split('T')[0]
      : formValue.appointmentDate;

    try {
      if (this.isEditMode && this.appointmentId) {
        await this.apiService.update(this.appointmentId, {
          appointmentDate,
          startTime: formValue.startTime,
          endTime: formValue.endTime,
          status: formValue.status,
          cancellationReason: formValue.cancellationReason || undefined,
          notes: formValue.notes || undefined,
        });
      } else {
        await this.apiService.create({
          assignedAdminId: formValue.assignedAdminId,
          appointmentDate,
          startTime: formValue.startTime,
          endTime: formValue.endTime,
          appointmentType: formValue.appointmentType,
          contactFormId: formValue.contactFormId || undefined,
          memberId: formValue.memberId || undefined,
          guestName: formValue.guestName || undefined,
          guestEmail: formValue.guestEmail || undefined,
          guestPhone: formValue.guestPhone || undefined,
          notes: formValue.notes || undefined,
        });
      }
      this.saving = false;
      this.router.navigate(['/appointments']);
    } catch {
      this.saving = false;
    }
  }

  onCancel(): void {
    this.router.navigate(['/appointments']);
  }

  get showCancellationReason(): boolean {
    return this.form.get('status')?.value === 4;
  }
}
