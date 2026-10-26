import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { InputErrorComponent } from '@shared';

export interface CancelWorkshopInvoiceDialogData {
  invoiceLabel: string;
  issued: boolean;
}

/** Asks for the cancel reason. Closes with the reason, or with nothing when dismissed. */
@Component({
  selector: 'lib-cancel-workshop-invoice-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, InputErrorComponent],
  templateUrl: './cancel-workshop-invoice-dialog.component.html',
  styleUrl: './cancel-workshop-invoice-dialog.component.scss',
})
export class CancelWorkshopInvoiceDialogComponent {
  readonly dialogRef = inject<MatDialogRef<CancelWorkshopInvoiceDialogComponent, string>>(MatDialogRef);
  readonly data = inject<CancelWorkshopInvoiceDialogData>(MAT_DIALOG_DATA);
  readonly reason = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] });

  onConfirm(): void {
    const reason = this.reason.value.trim();
    if (!reason) {
      this.reason.setValue('');
      this.reason.markAsTouched();
      return;
    }
    this.dialogRef.close(reason);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
