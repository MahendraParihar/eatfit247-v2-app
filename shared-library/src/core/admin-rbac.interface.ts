/** Role CRUD */
export interface IAdminRole {
  roleId: number;
  role: string;
  roleCode: string;
  grantAllOnNewSubject: boolean;
  createdAt: Date;
}

export interface IManageAdminRole {
  role: string;
  roleCode: string;
  grantAllOnNewSubject?: boolean;
}

/** Subject listing (read-only, developer-managed via migrations) */
export interface IAdminSubject {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  franchiseScoped: boolean;
  active: boolean;
  createdAt: Date;
}

/** Action listing (read-only) */
export interface IAdminAction {
  actionId: number;
  actionCode: string;
  actionName: string;
}

/** Permission matrix — returned by GET /admin-rbac/role/:roleId/permission-matrix */
export interface IPermissionMatrix {
  subjects: IAdminSubject[];
  actions: IAdminAction[];
  grants: IPermissionGrant[];
}

export interface IPermissionGrant {
  subjectId: number;
  actionId: number;
}

/** Payload for PUT /admin-rbac/role/:roleId/permission-matrix */
export interface IManagePermissionMatrix {
  grants: IPermissionGrant[];
}
