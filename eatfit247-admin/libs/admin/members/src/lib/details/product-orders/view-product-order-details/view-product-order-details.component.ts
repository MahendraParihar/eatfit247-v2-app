import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
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
    FormatCurrencyPipe
  ],
  templateUrl: './view-product-order-details.component.html',
  styleUrl: './view-product-order-details.component.scss'
})
export class ViewProductOrderDetailsComponent implements OnInit {
  private apiService = inject(MembersApiService);
  loading = signal(false);
  productOrder = signal<IMemberProduct | null>(null);
  displayedColumns: string[] = ['productName', 'quantityLabel', 'unitPrice', 'quantity', 'baseAmount', 'discountAmount', 'taxAmount', 'totalAmount'];

  constructor(
    public dialogRef: MatDialogRef<ViewProductOrderDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ViewProductOrderDetailsData
  ) {}

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
      console.error('Error loading product order details:', error);
    } finally {
      this.loading.set(false);
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

