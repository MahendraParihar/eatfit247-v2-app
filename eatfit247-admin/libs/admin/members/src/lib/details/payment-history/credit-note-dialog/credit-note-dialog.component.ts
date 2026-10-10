import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { IMemberPayment } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';

export interface CreditNoteDialogData {
  memberId: number;
  payment: IMemberPayment;
}

/** Issues a Tax Credit Note against a VAT invoice and downloads its PDF (roadmap 4.6). */
@Component({
  selector: 'lib-credit-note-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './credit-note-dialog.component.html',
  styleUrl: './credit-note-dialog.component.scss',
})
export class CreditNoteDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(MembersApiService);
  private dialogRef = inject(MatDialogRef<CreditNoteDialogComponent>);
  data = inject<CreditNoteDialogData>(MAT_DIALOG_DATA);
  saving = signal(false);

  form = this.fb.nonNullable.group({
    amount: [Number(this.data.payment.totalAmount) || 0, [Validators.required, Validators.min(0.01), Validators.max(Number(this.data.payment.totalAmount) || 0)]],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
    // Today's local date (toISOString would give the UTC date)
    eventDate: [new Date().toLocaleDateString('en-CA'), Validators.required],
  });

  async issue(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      const value = this.form.getRawValue();
      const note = await this.api.createCreditNote(this.data.memberId, {
        recordType: 'plan',
        recordId: this.data.payment.memberPaymentId,
        amount: Number(value.amount),
        reason: value.reason.trim(),
        eventDate: value.eventDate,
      });
      const file = await this.api.downloadCreditNote(this.data.memberId, note.creditNoteId);
      this.download(file.buffer, file.fileName);
      this.dialogRef.close(true);
    } catch {
      // Error toast (amount above what is creditable, …) is shown by HttpErrorInterceptor
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private download(base64: string, fileName: string): void {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
