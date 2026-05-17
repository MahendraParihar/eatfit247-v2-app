import { Injectable, inject } from '@angular/core';
import { CrudApiService, HttpService } from '@core';
import {
  IAdminRole,
  IAdminSubject,
  IManageAdminRole,
  IManagePermissionMatrix,
  IPermissionMatrix,
} from '@eatfit247-shared-lib';

@Injectable({ providedIn: 'root' })
export class AdminRbacApiService extends CrudApiService<IAdminRole, IManageAdminRole> {
  private http = inject(HttpService);

  constructor() {
    super('/admin-rbac/role');
  }

  async getSubjectList(): Promise<IAdminSubject[]> {
    const res = await this.http.get<IAdminSubject[]>('/admin-rbac/subject/list');
    return res.data as IAdminSubject[];
  }

  async getPermissionMatrix(roleId: number): Promise<IPermissionMatrix> {
    const res = await this.http.get<IPermissionMatrix>(
      `/admin-rbac/role/${roleId}/permission-matrix`,
    );
    return res.data as IPermissionMatrix;
  }

  async savePermissionMatrix(roleId: number, data: IManagePermissionMatrix): Promise<void> {
    await this.http.put<void>(`/admin-rbac/role/${roleId}/permission-matrix`, data);
  }
}
