import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { IMemberPayment } from '@eatfit247-shared-lib';

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

  formatCurrency(amount: number | undefined | null): string {
    if (amount === null || amount === undefined) {
      return '₹0';
    }
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(date: Date | string | undefined | null): string {
    if (!date) {
      return 'N/A';
    }
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatAddress(address: any): string {
    if (!address) {
      return 'N/A';
    }
    const parts: string[] = [];
    if (address.postalAddress) parts.push(address.postalAddress);
    if (address.cityVillage) parts.push(address.cityVillage);
    if (address.pinCode) parts.push(address.pinCode);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }

  close(): void {
    this.dialogRef.close();
  }
}

