import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { IMemberProduct } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../../api.service';
import { FormatCurrencyPipe } from '@shared';

export interface ViewProductOrderDetailsData {
  memberId: number;
  memberProductId: number;
}

@Component({
  selector: 'lib-view-product-order-details',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatTableModule,
    MatSnackBarModule,
    FormatCurrencyPipe
  ],
  templateUrl: './view-product-order-details.component.html',
  styleUrl: './view-product-order-details.component.scss'
})
export class ViewProductOrderDetailsComponent implements OnInit {
  dialogRef = inject<MatDialogRef<ViewProductOrderDetailsComponent>>(MatDialogRef);
  data = inject<ViewProductOrderDetailsData>(MAT_DIALOG_DATA);

  private apiService = inject(MembersApiService);
  private snackBar = inject(MatSnackBar);
  loading = signal(false);
  productOrder = signal<IMemberProduct | null>(null);
  displayedColumns: string[] = ['productName', 'quantityLabel', 'unitPrice', 'quantity', 'baseAmount', 'discountAmount', 'taxAmount', 'totalAmount'];

  ngOnInit(): void {
    this.loadProductOrderDetails();
  }

  async loadProductOrderDetails(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.apiService.getProductOrder(
        this.data.memberId,
        this.data.memberProductId
      );
      this.productOrder.set(result);
    } catch (error) {
      this.snackBar.open('Failed to load product order details. Please try again.', 'Close', {
        duration: 5000,
      });
    } finally {
      this.loading.set(false);
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  get isNotPaid(): boolean {
    const status = this.productOrder()?.paymentStatus?.toLowerCase();
    return status !== 'paid' && status !== 'success' && status !== 'completed';
  }

  get hasPaymentLink(): boolean {
    return !!this.productOrder()?.paymentLink;
  }

  copyPaymentLink(): void {
    const paymentLink = this.productOrder()?.paymentLink;
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink).then(
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

