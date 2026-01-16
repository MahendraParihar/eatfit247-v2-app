import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IContactFormReportItem } from '@eatfit247-shared-lib';
import { ContactFormReportApiService } from '../api.service';

export interface ContactFormDetailsDialogData {
  contactForm: IContactFormReportItem;
}

@Component({
  selector: 'lib-view-contact-form-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './view-contact-form-details.component.html',
  styleUrl: './view-contact-form-details.component.scss',
})
export class ViewContactFormDetailsComponent implements OnInit {
  contactForm!: IContactFormReportItem;
  responseForm!: FormGroup;
  loading = false;
  submitting = false;
  isReadonly = false;

  constructor(
    public dialogRef: MatDialogRef<ViewContactFormDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ContactFormDetailsDialogData,
    private fb: FormBuilder,
    private apiService: ContactFormReportApiService,
    private snackBar: MatSnackBar,
  ) {
    this.contactForm = data.contactForm;
    this.isReadonly = !!this.contactForm.respondedMessage;
    this.initializeForm();
  }

  ngOnInit(): void {
    // If response already exists, set it as readonly
    if (this.contactForm.respondedMessage) {
      this.responseForm.patchValue({
        respondedMessage: this.contactForm.respondedMessage,
      });
      this.responseForm.disable();
    }
  }

  private initializeForm(): void {
    this.responseForm = this.fb.group({
      respondedMessage: [
        this.contactForm.respondedMessage || '',
        this.isReadonly ? [] : [Validators.required, Validators.maxLength(1000)],
      ],
    });
  }

  async onSubmitResponse(): Promise<void> {
    if (this.responseForm.invalid || this.isReadonly) {
      return;
    }

    this.submitting = true;
    try {
      await this.apiService.sendResponse(this.contactForm.contactFormId, {
        respondedMessage: this.responseForm.value.respondedMessage,
      });

      this.snackBar.open('Response submitted successfully', 'Close', {
        duration: 3000,
      });

      // Reload contact form details to get updated response info
      const updatedDetails = await this.apiService.getContactFormDetails(
        this.contactForm.contactFormId,
      );
      this.contactForm = updatedDetails;
      this.isReadonly = true;
      this.responseForm.disable();
      this.responseForm.patchValue({
        respondedMessage: updatedDetails.respondedMessage,
      });

      // Close dialog and return updated data
      this.dialogRef.close({ updated: true });
    } catch (error) {
      console.error('Error submitting response:', error);
      this.snackBar.open('Failed to submit response. Please try again.', 'Close', {
        duration: 5000,
      });
    } finally {
      this.submitting = false;
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getFullContactNumber(): string {
    return `${this.contactForm.countryCode} ${this.contactForm.contactNumber}`;
  }

  getStatusChipClass(): string {
    return this.contactForm.isResponded ? 'status-responded' : 'status-pending';
  }
}

