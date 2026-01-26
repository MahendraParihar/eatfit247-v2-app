import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { IMemberPayment } from '@eatfit247-shared-lib';
import { AddressPipe, FormatCurrencyPipe } from '@shared';

export interface PaymentDetailsDialogData {
  payment: IMemberPayment;
}

@Component({
  selector: 'lib-payment-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
    DatePipe,
    AddressPipe,
    FormatCurrencyPipe,
  ],
  templateUrl: './payment-details-dialog.component.html',
  styleUrl: './payment-details-dialog.component.scss',
})
export class PaymentDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PaymentDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDetailsDialogData,
    private snackBar: MatSnackBar,
  ) {}

  get payment(): IMemberPayment {
    return this.data.payment;
  }

  get isPending(): boolean {
    return this.payment.paymentStatus?.toLowerCase() === 'pending';
  }

  get hasPaymentLink(): boolean {
    return !!this.payment.paymentLink;
  }

  copyPaymentLink(): void {
    if (this.payment.paymentLink) {
      navigator.clipboard.writeText(this.payment.paymentLink).then(
        () => {
          this.snackBar.open('Payment link copied to clipboard!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        },
        () => {
          this.snackBar.open('Failed to copy payment link', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        },
      );
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('success') || statusLower.includes('completed') || statusLower.includes('paid')) {
      return 'status-success';
    } else if (statusLower.includes('pending')) {
      return 'status-pending';
    } else if (statusLower.includes('failed') || statusLower.includes('cancelled') || statusLower.includes('refunded')) {
      return 'status-failed';
    }
    return '';
  }
}

