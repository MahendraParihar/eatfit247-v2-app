import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { DataTableComponent, ITableColumn, ITableConfig, ITableAction, EmptyStateType } from '@shared';
import { EmptyStateComponent } from '@shared';
import { LoaderComponent } from '@shared';
import {
  IMemberPayment,
  ITableList,
} from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';
import { ManageMemberPaymentComponent, ManageMemberPaymentData } from './manage-member-payment/manage-member-payment.component';

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
    LoaderComponent,
  ],
  templateUrl: './member-payment-history.component.html',
  styleUrl: './member-payment-history.component.scss',
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
        sortable: true,
      },
      {
        key: 'paymentDate',
        label: 'Payment Date',
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
        key: 'program',
        label: 'Program',
        dataKey: 'program',
        sortable: false,
      },
      {
        key: 'programPlan',
        label: 'Plan',
        dataKey: 'programPlan',
        sortable: false,
      },
      {
        key: 'paymentStatus',
        label: 'Status',
        dataKey: 'paymentStatus',
        sortable: false,
      },
      {
        key: 'totalAmount',
        label: 'Total Amount',
        dataKey: 'totalAmount',
        type: 'number',
        sortable: true,
        formatter: (value: any) => `₹${value ? Number(value).toLocaleString('en-IN') : '0'}`,
      },
      {
        key: 'createdAt',
        label: 'Created At',
        dataKey: 'createdAt',
        type: 'date',
        sortable: true,
      },
    ];

    const actions: ITableAction<IMemberPayment>[] = [
      {
        label: 'Edit',
        icon: 'edit',
        color: 'primary',
        onClick: (row) => this.editPayment(row),
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        onClick: (row: IMemberPayment) => this.deletePayment(row),
        visible: (row: IMemberPayment) => row.deletable === true,
      },
    ];

    this.tableConfig = {
      columns,
      actions,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      showPagination: true,
      showSearch: true,
      onRowClick: (row: IMemberPayment) => this.editPayment(row),
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
      memberId: this.memberId,
    };
    const dialogRef = this.dialog.open(ManageMemberPaymentComponent, {
      width: '1000px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Reload payments after successful create/update
        this.loadPayments();
      }
    });
  }

  editPayment(payment: IMemberPayment): void {
    const dialogData: ManageMemberPaymentData = {
      memberId: this.memberId,
      payment: payment,
    };
    const dialogRef = this.dialog.open(ManageMemberPaymentComponent, {
      width: '1000px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Reload payments after successful update
        this.loadPayments();
      }
    });
  }

  async deletePayment(payment: IMemberPayment): Promise<void> {
    if (
      confirm(
        `Are you sure you want to delete payment with invoice ID: ${payment.invoiceId}?`,
      )
    ) {
      try {
        await this.apiService.deletePayment(this.memberId, payment.memberPaymentId);
        this.loadPayments();
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Failed to delete payment. Please try again.');
      }
    }
  }
}
