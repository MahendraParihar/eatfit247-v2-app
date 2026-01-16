import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import {
  createdByUserFormatter,
  DataTableComponent,
  EmptyStateComponent,
  EmptyStateType,
  ITableAction,
  ITableColumn,
  ITableConfig,
  LoaderComponent
} from '@shared';
import { IAddress } from '@eatfit247-shared-lib';
import { MembersApiService } from '../../api.service';
import { Subject, takeUntil } from 'rxjs';
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
    DataTableComponent,
    EmptyStateComponent,
    LoaderComponent,
  ],
  templateUrl: './member-addresses.component.html',
  styleUrl: './member-addresses.component.scss',
})
export class MemberAddressesComponent implements OnInit, OnDestroy {
  memberId!: number;
  addresses: IAddress[] = [];
  loading = false;
  tableConfig!: ITableConfig<IAddress>;
  EmptyStateType = EmptyStateType;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private apiService: MembersApiService,
    private dialog: MatDialog,
  ) {
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
        key: 'addressType',
        label: 'Type',
        dataKey: 'addressType',
        sortable: false,
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
      console.error('Error loading addresses:', error);
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
    if (!confirm(`Are you sure you want to delete this address?`)) {
      return;
    }
    try {
      await this.apiService.deleteAddress(this.memberId, address.addressId);
      this.loadAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address. Please try again.');
    }
  }
}

