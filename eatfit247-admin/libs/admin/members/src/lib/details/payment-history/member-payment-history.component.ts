import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  DataTableComponent,
  EmptyStateComponent,
  EmptyStateType,
  ITableAction,
  ITableColumn,
  ITableConfig,
  LoaderComponent
} from '@shared';
import { IMemberPayment } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';
import {
  ManageMemberPaymentComponent,
  ManageMemberPaymentData
} from './manage-member-payment/manage-member-payment.component';
import {
  PaymentDetailsDialogComponent,
  PaymentDetailsDialogData
} from './payment-details-dialog/payment-details-dialog.component';

@Component({
  selector: 'lib-member-payment-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    DataTableComponent,
    EmptyStateComponent,
    LoaderComponent
  ],
  templateUrl: './member-payment-history.component.html',
  styleUrl: './member-payment-history.component.scss'
})
export class MemberPaymentHistoryComponent implements OnInit, OnDestroy {
  memberId!: number;
  payments: IMemberPayment[] = [];
  loading = false;
  tableConfig!: ITableConfig<IMemberPayment>;
  EmptyStateType = EmptyStateType;
  private routeParamsSubscription: any;

  constructor(
    private route: ActivatedRoute,
    private apiService: MembersApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.initializeTable();
  }

  ngOnInit(): void {
    this.routeParamsSubscription = this.route.parent?.params.subscribe((params) => {
      this.memberId = +params['id'];
      if (this.memberId) {
        this.loadPayments();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeParamsSubscription) {
      this.routeParamsSubscription.unsubscribe();
    }
  }

  private initializeTable(): void {
    const columns: ITableColumn<IMemberPayment>[] = [
      {
        key: 'invoiceId',
        label: 'Invoice ID',
        dataKey: 'invoiceId',
        sortable: true
      },
      {
        key: 'paymentDate',
        label: 'Payment Date',
        dataKey: 'paymentDate',
        type: 'date',
        sortable: true
      },
      {
        key: 'programPlan',
        label: 'Plan',
        dataKey: 'programPlan',
        sortable: false
      },
      {
        key: 'paymentStatus',
        label: 'Status',
        dataKey: 'paymentStatus',
        sortable: false
      },
      {
        key: 'totalAmount',
        label: 'Total Amount',
        dataKey: 'totalAmount',
        type: 'custom',
        sortable: true,
        formatter: (value: any, row: IMemberPayment) => {
          return `${row.currency || 'INR'} ${Number(row.totalAmount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`;
        }
      },
      {
        key: 'createdAt',
        label: 'Created At',
        dataKey: 'createdAt',
        type: 'date',
        sortable: true
      }
    ];
    const actions: ITableAction<IMemberPayment>[] = [
      {
        label: 'Edit',
        icon: 'edit',
        color: 'primary',
        onClick: (row) => this.editPayment(row)
      },
      {
        label: 'Details',
        icon: 'info',
        color: 'primary',
        onClick: (row) => this.viewPaymentDetails(row)
      },
      {
        label: 'Download Invoice',
        icon: 'download',
        color: 'accent',
        onClick: (row) => this.downloadInvoice(row)
      }
    ];
    this.tableConfig = {
      columns,
      actions,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      showPagination: true,
      showSearch: true,
      onRowClick: (row: IMemberPayment) => this.viewPaymentDetails(row)
    };
  }

  async loadPayments(): Promise<void> {
    this.loading = true;
    try {
      const res = await this.apiService.getPayments(this.memberId);
      this.payments = res.tableData || [];
    } catch (error) {
      console.error('Error loading payments:', error);
      this.payments = [];
    } finally {
      this.loading = false;
    }
  }

  addPayment(): void {
    const dialogData: ManageMemberPaymentData = {
      memberId: this.memberId
    };
    const dialogRef = this.dialog.open(ManageMemberPaymentComponent, {
      width: '1000px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: dialogData
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Reload payments after a successful create / update
        this.loadPayments();
      }
    });
  }

  editPayment(payment: IMemberPayment): void {
    const dialogData: ManageMemberPaymentData = {
      memberId: this.memberId,
      payment: payment
    };
    const dialogRef = this.dialog.open(ManageMemberPaymentComponent, {
      width: '1000px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: dialogData
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Reload payments after successful update
        this.loadPayments();
      }
    });
  }

  viewPaymentDetails(payment: IMemberPayment): void {
    const dialogData: PaymentDetailsDialogData = {
      payment: payment
    };
    this.dialog.open(PaymentDetailsDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: dialogData
    });
  }

  async downloadInvoice(payment: IMemberPayment): Promise<void> {
    if (!payment.memberPaymentId) {
      this.snackBar.open('Payment ID not found', 'Close', {
        duration: 3000
      });
      return;
    }

    try {
      const fileData = await this.apiService.downloadInvoice(
        this.memberId,
        payment.memberPaymentId
      );
      if (fileData) {
        this.downloadTemplate(fileData.buffer, fileData.fileName);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      this.snackBar.open('Failed to download invoice', 'Close', {
        duration: 3000
      });
    }
  }

  downloadTemplate(base64String: string, fileName: string): void {
    if (base64String) {
      const mediaType = 'data:application/pdf;base64,';
      const link = document.createElement('a');
      link.setAttribute('target', '_blank');
      link.setAttribute('href', mediaType + base64String);
      link.setAttribute('download', `${fileName}`);
      link.click();
      link.remove();
    }
  }
}
