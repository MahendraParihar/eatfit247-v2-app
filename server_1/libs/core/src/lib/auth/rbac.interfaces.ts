export interface ICachedPermissions {
  adminId: number;
  roles: Array<{ roleId: number; role: string; roleCode: string }>;
  permissions: Record<string, string[]>;
  franchiseIds: number[];
  subjectMeta: Record<string, { franchiseScoped: boolean }>;
  /** Holds a role with grant_all_on_new_subject (Super Admin): every franchise, whatever the mapping */
  allFranchises: boolean;
}
