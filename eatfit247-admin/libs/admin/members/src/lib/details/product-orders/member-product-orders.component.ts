import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
import {
  ManageMemberProductOrderComponent,
  ManageMemberProductOrderData
} from './manage-member-product-order/manage-member-product-order.component';
import {
  PlaceProductOrderComponent,
  PlaceProductOrderData
} from './place-product-order/place-product-order.component';
import {
  ViewProductOrderDetailsComponent,
  ViewProductOrderDetailsData
} from './view-product-order-details/view-product-order-details.component';

@Component({
  selector: 'lib-member-product-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
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
  private dialog = inject(MatDialog);

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
        dataKey: 'totalAmount',
        sortable: false,
        formatter: (value: number | undefined, row: any) => {
          if (!value && !row?.totalAmount) return '₹0';
          const totalAmount = value || row?.totalAmount || 0;
          const currency = row?.currency || 'INR';
          const currencySymbol = currency === 'INR' ? '₹' : currency;
          return `${currencySymbol}${Number(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      actionsConfig: {
        buttons: [
          {
            label: 'View Details',
            icon: 'visibility',
            tooltip: 'View Order Details',
            onClick: (row: IMemberProduct) => this.viewProductOrderDetails(row)
          }
        ],
        column: {
          headerLabel: 'Actions',
          align: 'center',
          width: '100px'
        }
      }
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

  addProductOrder(): void {
    if (!this.memberId) {
      console.error('Member ID is not available');
      return;
    }
    const dialogData: PlaceProductOrderData = {
      memberId: this.memberId
    };
    const dialogRef = this.dialog.open(PlaceProductOrderComponent, {
      width: '1200px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      data: dialogData
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Reload product orders after a successful create / update
        this.loadProductOrders();
      }
    });
  }

  editProductOrder(productOrder: IMemberProduct): void {
    const dialogData: ManageMemberProductOrderData = {
      memberId: this.memberId,
      productOrder: productOrder
    };
    const dialogRef = this.dialog.open(ManageMemberProductOrderComponent, {
      width: '1000px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: dialogData
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Reload product orders after successful update
        this.loadProductOrders();
      }
    });
  }

  viewProductOrderDetails(productOrder: IMemberProduct): void {
    if (!this.memberId || !productOrder.memberProductId) {
      console.error('Member ID or Product Order ID is not available');
      return;
    }
    const dialogData: ViewProductOrderDetailsData = {
      memberId: this.memberId,
      memberProductId: productOrder.memberProductId
    };
    this.dialog.open(ViewProductOrderDetailsComponent, {
      width: '1200px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      data: dialogData,
      disableClose: false
    });
  }
}

