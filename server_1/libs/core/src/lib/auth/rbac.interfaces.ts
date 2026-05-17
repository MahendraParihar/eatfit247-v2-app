export interface ICachedPermissions {
  adminId: number;
  roles: Array<{ roleId: number; role: string; roleCode: string }>;
  permissions: Record<string, string[]>;
  franchiseIds: number[];
  subjectMeta: Record<string, { franchiseScoped: boolean }>;
}
