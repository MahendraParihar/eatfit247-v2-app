import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Subscription } from 'rxjs';
import {
  DataTableComponent,
  EmptyStateComponent,
  EmptyStateType,
  ITableColumn,
  ITableConfig,
  LoaderComponent
} from '@shared';
import { IMemberProduct } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';

@Component({
  selector: 'lib-member-product-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    DataTableComponent,
    EmptyStateComponent,
    LoaderComponent,
  ],
  templateUrl: './member-product-orders.component.html',
  styleUrl: './member-product-orders.component.scss',
})
export class MemberProductOrdersComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private apiService = inject(MembersApiService);

  memberId!: number;
  productOrders: IMemberProduct[] = [];
  loading = false;
  tableConfig!: ITableConfig<IMemberProduct>;
  EmptyStateType = EmptyStateType;
  private routeParamsSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.initializeTable();
    const subscription = this.route.parent?.params.subscribe((params) => {
      this.memberId = +params['id'];
      if (this.memberId) {
        this.loadProductOrders();
      }
    });
    if (subscription) {
      this.routeParamsSubscription = subscription;
    }
  }

  ngOnDestroy(): void {
    if (this.routeParamsSubscription) {
      this.routeParamsSubscription.unsubscribe();
    }
  }

  private initializeTable(): void {
    const columns: ITableColumn<IMemberProduct>[] = [
      {
        key: 'invoiceId',
        label: 'Invoice ID',
        dataKey: 'invoiceId',
        sortable: true,
      },
      {
        key: 'paymentDate',
        label: 'Order Date',
        dataKey: 'paymentDate',
        type: 'date',
        sortable: true,
      },
      {
        key: 'paymentMode',
        label: 'Payment Mode',
        dataKey: 'paymentMode',
        sortable: false,
      },
      {
        key: 'paymentStatus',
        label: 'Status',
        dataKey: 'paymentStatus',
        sortable: false,
        formatter: (value: string | undefined) => {
          return value || 'N/A';
        },
      },
      {
        key: 'totalAmount',
        label: 'Total Amount',
        dataKey: 'paymentObj',
        sortable: false,
        formatter: (value: Record<string, unknown> | undefined) => {
          if (!value) return '₹0';
          const userSection = value?.['user'] as { totalAmount?: number } | undefined;
          const totalAmount = userSection?.totalAmount || (value?.['totalAmount'] as number) || 0;
          return `₹${Number(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        },
      },
      {
        key: 'transactionId',
        label: 'Transaction ID',
        dataKey: 'transactionId',
        sortable: false,
      },
      {
        key: 'gatewayOrderId',
        label: 'Gateway Order ID',
        dataKey: 'gatewayOrderId',
        sortable: false,
      },
      {
        key: 'paymentSource',
        label: 'Payment Source',
        dataKey: 'paymentSource',
        sortable: false,
      },
      {
        key: 'createdAt',
        label: 'Created At',
        dataKey: 'createdAt',
        type: 'date',
        sortable: true,
      },
    ];

    this.tableConfig = {
      columns,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      showPagination: true,
      showSearch: true,
    };
  }

  async loadProductOrders(): Promise<void> {
    this.loading = true;
    try {
      const res = await this.apiService.getProductOrders(this.memberId);
      this.productOrders = res.tableData || [];
    } catch (error) {
      console.error('Error loading product orders:', error);
      this.productOrders = [];
    } finally {
      this.loading = false;
    }
  }

  getStatusClass(status: string): string {
    if (!status) return '';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('success') || statusLower.includes('completed') || statusLower.includes('paid')) {
      return 'status-success';
    } else if (statusLower.includes('pending') || statusLower.includes('pending')) {
      return 'status-pending';
    } else if (statusLower.includes('failed') || statusLower.includes('cancelled') || statusLower.includes('refunded')) {
      return 'status-failed';
    }
    return '';
  }
}

