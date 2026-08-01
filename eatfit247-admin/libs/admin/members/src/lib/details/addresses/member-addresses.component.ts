import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createdByUserFormatter,
  DataTableComponent,
  EmptyStateComponent,
  EmptyStateType,
  ITableAction,
  ITableColumn,
  ITableConfig,
  LoaderComponent,
  WarningDialogComponent,
  WarningDialogData
} from '@shared';
import { IAddress } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import {
  ManageMemberAddressComponent,
  ManageMemberAddressData
} from './manage-member-address/manage-member-address.component';

@Component({
  selector: 'lib-member-addresses',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    DataTableComponent,
    EmptyStateComponent,
    LoaderComponent,
  ],
  templateUrl: './member-addresses.component.html',
  styleUrl: './member-addresses.component.scss',
})
export class MemberAddressesComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private apiService = inject(MembersApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  memberId!: number;
  addresses: IAddress[] = [];
  loading = false;
  tableConfig!: ITableConfig<IAddress>;
  EmptyStateType = EmptyStateType;
  private destroy$ = new Subject<void>();

  constructor() {
    this.initializeTable();
  }

  ngOnInit(): void {
    this.route.parent?.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.memberId = +params['id'];
        if (this.memberId) {
          this.loadAddresses();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTable(): void {
    const columns: ITableColumn<IAddress>[] = [
      {
        key: 'addressName',
        label: 'Address Name',
        dataKey: 'addressName',
        sortable: true,
      },
      {
        key: 'postalAddress',
        label: 'Address',
        dataKey: 'postalAddress',
        sortable: false,
      },
      {
        key: 'cityVillage',
        label: 'City',
        dataKey: 'cityVillage',
        sortable: true,
      },
      {
        key: 'state',
        label: 'State',
        dataKey: 'state',
        sortable: false,
      },
      {
        key: 'country',
        label: 'Country',
        dataKey: 'country',
        sortable: false,
      },
      {
        key: 'pinCode',
        label: 'Pin Code',
        dataKey: 'pinCode',
        sortable: true,
      },
      {
        key: 'createdByUser',
        label: 'Created By',
        dataKey: 'createdByUser',
        sortable: false,
        formatter: createdByUserFormatter(),
      },
      {
        key: 'createdAt',
        label: 'Created At',
        dataKey: 'createdAt',
        type: 'date',
        sortable: true,
      },
    ];

    const actions: ITableAction<IAddress>[] = [
      {
        label: 'Edit',
        icon: 'edit',
        color: 'primary',
        onClick: (row) => this.editAddress(row),
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        onClick: (row) => this.deleteAddress(row),
      },
    ];

    this.tableConfig = {
      columns,
      actions,
      pageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      showPagination: true,
      showSearch: true,
    };
  }

  async loadAddresses(): Promise<void> {
    this.loading = true;
    try {
      this.addresses = await this.apiService.getAddresses(this.memberId);
    } catch (error) {
      this.snackBar.open('Failed to load addresses. Please try again.', 'Close', {
        duration: 5000,
      });
      this.addresses = [];
    } finally {
      this.loading = false;
    }
  }

  addAddress(): void {
    const dialogData: ManageMemberAddressData = {
      memberId: this.memberId,
    };
    const dialogRef = this.dialog.open(ManageMemberAddressComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.loadAddresses();
      }
    });
  }

  editAddress(address: IAddress): void {
    const dialogData: ManageMemberAddressData = {
      memberId: this.memberId,
      address: address,
    };
    const dialogRef = this.dialog.open(ManageMemberAddressComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.loadAddresses();
      }
    });
  }

  async deleteAddress(address: IAddress): Promise<void> {
    const dialogData: WarningDialogData = {
      title: 'Delete Address',
      message: 'Are you sure you want to delete this address? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };
    const dialogRef = this.dialog.open(WarningDialogComponent, {
      width: '500px',
      data: dialogData
    });
    const confirmed = (await firstValueFrom(dialogRef.afterClosed())) === true;
    if (!confirmed) {
      return;
    }
    try {
      await this.apiService.deleteAddress(this.memberId, address.addressId);
      this.snackBar.open('Address deleted successfully', 'Close', {
        duration: 3000,
      });
      this.loadAddresses();
    } catch (error) {
      this.snackBar.open('Failed to delete address. Please try again.', 'Close', {
        duration: 5000,
      });
    }
  }
}

