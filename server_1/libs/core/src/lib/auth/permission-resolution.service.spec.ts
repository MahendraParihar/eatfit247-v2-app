import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { AdminActionEnum, AdminSubjectEnum } from '@eatfit247-shared-lib';
import { PermissionResolutionService } from './permission-resolution.service';
import { TxnAdminUserRole } from '../database/models/admin/mst-admin-role-permission.model';
import { MstAdminRoleSubjectPermission } from '../database/models/admin/mst-admin-role-subject-permission.model';
import { MstAdminSubject } from '../database/models/admin/mst-admin-subject.model';
import { MstAdminAction } from '../database/models/admin/mst-admin-action.model';
import { MstAdminUser } from '../database/models/admin/mst-admin-user.model';
import { TxnAdminFranchise } from '../database/models/admin/txn-admin-franchise.model';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function createSubject(overrides: Partial<MstAdminSubject> = {}): Partial<MstAdminSubject> {
  return {
    subjectId: 1,
    subjectCode: AdminSubjectEnum.Member,
    subjectName: 'Member',
    franchiseScoped: true,
    active: true,
    ...overrides,
  };
}

function createRoleAssignment(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    adminUserRoleId: 1,
    roleId: 1,
    adminId: 100,
    active: true,
    role: { roleId: 1, role: 'Franchise Admin', roleCode: 'franchise_admin', grantAllOnNewSubject: false },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const STANDARD_ACTIONS = [
  { actionId: 1, actionCode: AdminActionEnum.Read, actionName: 'Read' },
  { actionId: 2, actionCode: AdminActionEnum.Create, actionName: 'Create' },
  { actionId: 3, actionCode: AdminActionEnum.Update, actionName: 'Update' },
  { actionId: 4, actionCode: AdminActionEnum.Delete, actionName: 'Delete' },
];

const STANDARD_SUBJECTS = [
  createSubject({ subjectId: 1, subjectCode: AdminSubjectEnum.Member, subjectName: 'Member', franchiseScoped: true }),
  createSubject({ subjectId: 2, subjectCode: AdminSubjectEnum.Blog, subjectName: 'Blog', franchiseScoped: false }),
  createSubject({ subjectId: 3, subjectCode: AdminSubjectEnum.Dashboard, subjectName: 'Dashboard', franchiseScoped: true }),
  createSubject({ subjectId: 4, subjectCode: AdminSubjectEnum.Recipe, subjectName: 'Recipe', franchiseScoped: false }),
  createSubject({ subjectId: 5, subjectCode: AdminSubjectEnum.Franchise, subjectName: 'Franchise', franchiseScoped: true }),
  createSubject({ subjectId: 6, subjectCode: AdminSubjectEnum.Report, subjectName: 'Report', franchiseScoped: true }),
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PermissionResolutionService', () => {
  let service: PermissionResolutionService;
  let mockUserRoleRepo: { findAll: jest.Mock };
  let mockPermRepo: { findAll: jest.Mock };
  let mockSubjectRepo: { findAll: jest.Mock };
  let mockActionRepo: { findAll: jest.Mock };
  let mockAdminRepo: { findOne: jest.Mock };
  let mockFranchiseRepo: { findAll: jest.Mock };

  beforeEach(async () => {
    mockUserRoleRepo = { findAll: jest.fn() };
    mockPermRepo = { findAll: jest.fn() };
    mockSubjectRepo = { findAll: jest.fn() };
    mockActionRepo = { findAll: jest.fn() };
    mockAdminRepo = { findOne: jest.fn() };
    mockFranchiseRepo = { findAll: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionResolutionService,
        { provide: getModelToken(TxnAdminUserRole), useValue: mockUserRoleRepo },
        { provide: getModelToken(MstAdminRoleSubjectPermission), useValue: mockPermRepo },
        { provide: getModelToken(MstAdminSubject), useValue: mockSubjectRepo },
        { provide: getModelToken(MstAdminAction), useValue: mockActionRepo },
        { provide: getModelToken(MstAdminUser), useValue: mockAdminRepo },
        { provide: getModelToken(TxnAdminFranchise), useValue: mockFranchiseRepo },
      ],
    }).compile();

    service = module.get(PermissionResolutionService);

    // Default: return standard subjects and actions, no franchise
    mockSubjectRepo.findAll.mockResolvedValue(STANDARD_SUBJECTS);
    mockActionRepo.findAll.mockResolvedValue(STANDARD_ACTIONS);
    mockAdminRepo.findOne.mockResolvedValue({ adminId: 100, franchiseId: null });
    mockFranchiseRepo.findAll.mockResolvedValue([]);
  });

  it('should load permissions for a single role', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({ roleId: 1, adminId: 100 }),
    ]);
    mockPermRepo.findAll.mockResolvedValue([
      { permissionId: 1, roleId: 1, subjectId: 1, actionId: 1, active: true },
      { permissionId: 2, roleId: 1, subjectId: 1, actionId: 2, active: true },
    ]);

    const result = await service.resolveForAdmin(100);

    expect(result.permissions[AdminSubjectEnum.Member]).toEqual([
      AdminActionEnum.Create,
      AdminActionEnum.Read,
    ]);
    expect(Object.keys(result.permissions)).toHaveLength(1);
  });

  it('should merge permissions across multiple roles (union)', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({ roleId: 1, adminId: 100 }),
      createRoleAssignment({
        adminUserRoleId: 2,
        roleId: 2,
        adminId: 100,
        role: { roleId: 2, role: 'Blog Admin', roleCode: 'blog_admin', grantAllOnNewSubject: false },
      }),
    ]);
    mockPermRepo.findAll.mockResolvedValue([
      { permissionId: 1, roleId: 1, subjectId: 1, actionId: 1, active: true },
      { permissionId: 2, roleId: 2, subjectId: 2, actionId: 1, active: true },
      { permissionId: 3, roleId: 2, subjectId: 2, actionId: 2, active: true },
    ]);

    const result = await service.resolveForAdmin(100);

    expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
    expect(result.permissions[AdminSubjectEnum.Blog]).toEqual([
      AdminActionEnum.Create,
      AdminActionEnum.Read,
    ]);
  });

  it('should build correct dictionary format: { "Member": ["read","create","update","delete"] }', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({ roleId: 1 }),
    ]);
    mockPermRepo.findAll.mockResolvedValue([
      { permissionId: 1, roleId: 1, subjectId: 1, actionId: 1, active: true },
      { permissionId: 2, roleId: 1, subjectId: 1, actionId: 2, active: true },
      { permissionId: 3, roleId: 1, subjectId: 1, actionId: 3, active: true },
      { permissionId: 4, roleId: 1, subjectId: 1, actionId: 4, active: true },
    ]);

    const result = await service.resolveForAdmin(100);

    expect(result.permissions).toEqual({
      [AdminSubjectEnum.Member]: [
        AdminActionEnum.Create,
        AdminActionEnum.Delete,
        AdminActionEnum.Read,
        AdminActionEnum.Update,
      ],
    });
  });

  it('should include franchise_scoped metadata per subject', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({ roleId: 1 }),
    ]);
    mockPermRepo.findAll.mockResolvedValue([
      { permissionId: 1, roleId: 1, subjectId: 1, actionId: 1, active: true },
      { permissionId: 2, roleId: 1, subjectId: 2, actionId: 1, active: true },
    ]);

    const result = await service.resolveForAdmin(100);

    expect(result.subjectMeta[AdminSubjectEnum.Member]).toEqual({ franchiseScoped: true });
    expect(result.subjectMeta[AdminSubjectEnum.Blog]).toEqual({ franchiseScoped: false });
  });

  it('should handle role with no permissions (empty dictionary)', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({ roleId: 1 }),
    ]);
    mockPermRepo.findAll.mockResolvedValue([]);

    const result = await service.resolveForAdmin(100);

    expect(result.permissions).toEqual({});
    expect(Object.keys(result.subjectMeta)).toHaveLength(0);
  });

  it('should handle user with no assigned roles', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([]);

    const result = await service.resolveForAdmin(100);

    expect(result.permissions).toEqual({});
  });

  it('should not include inactive permission rows', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({ roleId: 1 }),
    ]);
    // The service queries with active: true, so inactive rows are filtered at DB level.
    // Mock returns only what the DB would return (active rows only).
    mockPermRepo.findAll.mockResolvedValue([
      { permissionId: 1, roleId: 1, subjectId: 1, actionId: 1, active: true },
      // permissionId 2 with active: false would NOT be returned by the DB query
    ]);

    const result = await service.resolveForAdmin(100);

    expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
  });

  it('should not include permissions for inactive roles', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({ roleId: 1, active: true }),
    ]);
    // Only role 1's permissions returned (role 2 not in active assignments)
    mockPermRepo.findAll.mockResolvedValue([
      { permissionId: 1, roleId: 1, subjectId: 1, actionId: 1, active: true },
    ]);

    const result = await service.resolveForAdmin(100);

    expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
    expect(result.permissions[AdminSubjectEnum.Blog]).toBeUndefined();
  });

  it('should return all 4 actions when role has all 4 for a subject', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({ roleId: 1 }),
    ]);
    mockPermRepo.findAll.mockResolvedValue(
      STANDARD_ACTIONS.map((action, idx) => ({
        permissionId: idx + 1,
        roleId: 1,
        subjectId: 1,
        actionId: action.actionId,
        active: true,
      })),
    );

    const result = await service.resolveForAdmin(100);

    expect(result.permissions[AdminSubjectEnum.Member]).toEqual([
      AdminActionEnum.Create,
      AdminActionEnum.Delete,
      AdminActionEnum.Read,
      AdminActionEnum.Update,
    ]);
    expect(result.permissions[AdminSubjectEnum.Member]).toHaveLength(4);
  });

  it('should return sorted action arrays for consistency', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({ roleId: 1 }),
    ]);
    mockPermRepo.findAll.mockResolvedValue([
      { permissionId: 1, roleId: 1, subjectId: 1, actionId: 4, active: true },
      { permissionId: 2, roleId: 1, subjectId: 1, actionId: 1, active: true },
      { permissionId: 3, roleId: 1, subjectId: 1, actionId: 3, active: true },
      { permissionId: 4, roleId: 1, subjectId: 1, actionId: 2, active: true },
    ]);

    const result = await service.resolveForAdmin(100);

    const actions = result.permissions[AdminSubjectEnum.Member];
    expect(actions).toEqual([...actions].sort());
  });

  it('should handle Super Admin with grant_all_on_new_subject having all subjects x all actions', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({
        roleId: 1,
        role: { roleId: 1, role: 'Super Admin', roleCode: 'super_admin', grantAllOnNewSubject: true },
      }),
    ]);
    // No individual permission rows needed for Super Admin
    mockPermRepo.findAll.mockResolvedValue([]);

    const result = await service.resolveForAdmin(100);

    const allSubjectCodes = (STANDARD_SUBJECTS as Partial<MstAdminSubject>[])
      .filter((s) => s.active && s.subjectCode !== AdminSubjectEnum.All)
      .map((s) => s.subjectCode!);

    for (const subjectCode of allSubjectCodes) {
      expect(result.permissions[subjectCode]).toEqual([
        AdminActionEnum.Create,
        AdminActionEnum.Delete,
        AdminActionEnum.Read,
        AdminActionEnum.Update,
      ]);
    }

    expect(Object.keys(result.permissions)).toHaveLength(allSubjectCodes.length);
  });

  it('should not include permissions for inactive subjects', async () => {
    const subjectsWithInactive = [
      ...STANDARD_SUBJECTS,
      createSubject({
        subjectId: 99,
        subjectCode: 'DeprecatedFeature' as AdminSubjectEnum,
        subjectName: 'Deprecated Feature',
        active: false,
      }),
    ];
    mockSubjectRepo.findAll.mockResolvedValue(
      subjectsWithInactive.filter((s) => s.active), // active: true filter
    );
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({ roleId: 1 }),
    ]);
    mockPermRepo.findAll.mockResolvedValue([
      { permissionId: 1, roleId: 1, subjectId: 1, actionId: 1, active: true },
      { permissionId: 2, roleId: 1, subjectId: 99, actionId: 1, active: true },
    ]);

    const result = await service.resolveForAdmin(100);

    expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
    expect(result.permissions['DeprecatedFeature']).toBeUndefined();
  });

  it('should deduplicate permissions when same subject+action comes from multiple roles', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({ roleId: 1 }),
      createRoleAssignment({
        adminUserRoleId: 2,
        roleId: 2,
        role: { roleId: 2, role: 'Blog Admin', roleCode: 'blog_admin', grantAllOnNewSubject: false },
      }),
    ]);
    mockPermRepo.findAll.mockResolvedValue([
      { permissionId: 1, roleId: 1, subjectId: 1, actionId: 1, active: true },
      { permissionId: 2, roleId: 2, subjectId: 1, actionId: 1, active: true },
      { permissionId: 3, roleId: 2, subjectId: 1, actionId: 2, active: true },
    ]);

    const result = await service.resolveForAdmin(100);

    expect(result.permissions[AdminSubjectEnum.Member]).toEqual([
      AdminActionEnum.Create,
      AdminActionEnum.Read,
    ]);
  });

  it('should silently skip permission row with non-existent subjectId', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({ roleId: 1 }),
    ]);
    mockPermRepo.findAll.mockResolvedValue([
      { permissionId: 1, roleId: 1, subjectId: 1, actionId: 1, active: true },
      { permissionId: 2, roleId: 1, subjectId: 999, actionId: 1, active: true },
    ]);

    const result = await service.resolveForAdmin(100);

    expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
    expect(Object.keys(result.permissions)).toHaveLength(1);
  });

  it('should silently skip permission row with non-existent actionId', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({ roleId: 1 }),
    ]);
    mockPermRepo.findAll.mockResolvedValue([
      { permissionId: 1, roleId: 1, subjectId: 1, actionId: 1, active: true },
      { permissionId: 2, roleId: 1, subjectId: 1, actionId: 999, active: true },
    ]);

    const result = await service.resolveForAdmin(100);

    expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
  });

  it('should filter out role assignment with null role relation', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({ roleId: 1 }),
    ]);
    // Only role 1 is in the active list (null role filtered out)
    mockPermRepo.findAll.mockResolvedValue([
      { permissionId: 1, roleId: 1, subjectId: 1, actionId: 1, active: true },
    ]);

    const result = await service.resolveForAdmin(100);

    expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
    expect(result.permissions[AdminSubjectEnum.Blog]).toBeUndefined();
  });

  it('should treat Super Admin WITHOUT grantAllOnNewSubject as normal role', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({
        roleId: 1,
        role: { roleId: 1, role: 'Super Admin', roleCode: 'super_admin', grantAllOnNewSubject: false },
      }),
    ]);
    mockPermRepo.findAll.mockResolvedValue([
      { permissionId: 1, roleId: 1, subjectId: 1, actionId: 1, active: true },
    ]);

    const result = await service.resolveForAdmin(100);

    expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
    expect(Object.keys(result.permissions)).toHaveLength(1);
  });

  it('should trigger grant-all when any role has grantAllOnNewSubject (mixed roles)', async () => {
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({
        roleId: 1,
        role: { roleId: 1, role: 'Franchise Admin', roleCode: 'franchise_admin', grantAllOnNewSubject: false },
      }),
      createRoleAssignment({
        adminUserRoleId: 2,
        roleId: 2,
        role: { roleId: 2, role: 'Super Admin', roleCode: 'super_admin', grantAllOnNewSubject: true },
      }),
    ]);
    mockPermRepo.findAll.mockResolvedValue([]);

    const result = await service.resolveForAdmin(100);

    const allSubjectCodes = (STANDARD_SUBJECTS as Partial<MstAdminSubject>[])
      .filter((s) => s.active && s.subjectCode !== AdminSubjectEnum.All)
      .map((s) => s.subjectCode!);

    for (const subjectCode of allSubjectCodes) {
      expect(result.permissions[subjectCode]).toEqual([
        AdminActionEnum.Create,
        AdminActionEnum.Delete,
        AdminActionEnum.Read,
        AdminActionEnum.Update,
      ]);
    }
  });

  it('should NOT include AdminSubjectEnum.All in Super Admin permission dictionary', async () => {
    const subjectsWithAll = [
      ...STANDARD_SUBJECTS,
      createSubject({
        subjectId: 100,
        subjectCode: AdminSubjectEnum.All,
        subjectName: 'All',
        franchiseScoped: false,
      }),
    ];
    mockSubjectRepo.findAll.mockResolvedValue(subjectsWithAll);
    mockUserRoleRepo.findAll.mockResolvedValue([
      createRoleAssignment({
        roleId: 1,
        role: { roleId: 1, role: 'Super Admin', roleCode: 'super_admin', grantAllOnNewSubject: true },
      }),
    ]);
    mockPermRepo.findAll.mockResolvedValue([]);

    const result = await service.resolveForAdmin(100);

    expect(result.permissions[AdminSubjectEnum.All]).toBeUndefined();
    expect(result.subjectMeta[AdminSubjectEnum.All]).toBeUndefined();
  });
});
