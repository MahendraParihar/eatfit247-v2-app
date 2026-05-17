import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { IAdminRole } from '@eatfit247-shared-lib';
import { AdminRbacApiService } from '../api.service';

@Component({
  selector: 'lib-role-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './role-list.html',
  styleUrl: './role-list.scss',
})
export class RoleList extends BaseListComponent<IAdminRole> {
  protected apiService = inject(AdminRbacApiService);
  private readonly routerRef = inject(Router);

  protected listConfig = {
    editRoute: '/admin-rbac/edit',
    createRoute: '/admin-rbac/new',
    searchPlaceholder: 'Search roles...',
    emptyMessage: 'No roles found',
  };

  protected buildEntityColumns(): ITableColumn<IAdminRole>[] {
    return [
      { key: 'roleId', label: 'ID', dataKey: 'roleId', sortable: true, width: '80px' },
      { key: 'role', label: 'Role Name', dataKey: 'role', sortable: true, searchable: true },
      { key: 'roleCode', label: 'Role Code', dataKey: 'roleCode', sortable: true, searchable: true },
      {
        key: 'grantAllOnNewSubject',
        label: 'Grant All',
        dataKey: 'grantAllOnNewSubject',
        sortable: true,
        width: '120px',
        align: 'center',
        formatter: (value: unknown) => (value ? 'Yes' : 'No'),
      },
    ];
  }

  protected getItemId(item: IAdminRole): number {
    return item.roleId;
  }

  protected getItemDisplayName(item: IAdminRole): string {
    return item.role;
  }

  /** Override: no active/inactive toggle, no audit columns (MstAdminRole lacks these fields). */
  protected override buildCommonColumns(): ITableColumn<IAdminRole>[] {
    return [
      { key: 'createdAt', label: 'Created At', dataKey: 'createdAt', type: 'date', sortable: true },
    ];
  }

  /** Override: Edit + Permissions actions only (no status toggle). */
  protected override buildActions(): ITableAction<IAdminRole>[] {
    return [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      {
        label: 'Permissions',
        icon: 'security',
        color: 'accent',
        onClick: (row) => this.routerRef.navigate(['/admin-rbac', this.getItemId(row), 'permissions']),
      },
    ];
  }
}
