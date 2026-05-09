import { AdminActionEnum, AdminSubjectEnum } from '@eatfit247-shared-lib';

// ---------------------------------------------------------------------------
// Interfaces matching the 3 new DB tables from the PRD
// ---------------------------------------------------------------------------

interface IMstAdminSubject {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  franchiseScoped: boolean;
  active: boolean;
}

interface IMstAdminAction {
  actionId: number;
  actionCode: string;
  actionName: string;
}

interface IMstAdminRoleSubjectPermission {
  permissionId: number;
  roleId: number;
  subjectId: number;
  actionId: number;
  active: boolean;
}

/** Role assignment row (existing mst_admin_role_permissions table) */
interface IRoleAssignment {
  adminRolePermissionId: number;
  roleId: number;
  adminId: number;
  active: boolean;
  role: { roleId: number; role: string; roleCode: string; grantAllOnNewSubject?: boolean };
}

/** The output permission dictionary as returned by the login API */
interface IPermissionDictionary {
  permissions: Record<string, string[]>;
  subjectMeta: Record<string, { franchiseScoped: boolean }>;
}

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function createSubject(overrides: Partial<IMstAdminSubject> = {}): IMstAdminSubject {
  return {
    subjectId: 1,
    subjectCode: AdminSubjectEnum.Member,
    subjectName: 'Member',
    franchiseScoped: true,
    active: true,
    ...overrides,
  };
}

function createAction(overrides: Partial<IMstAdminAction> = {}): IMstAdminAction {
  return {
    actionId: 1,
    actionCode: AdminActionEnum.Read,
    actionName: 'Read',
    ...overrides,
  };
}

function createPermission(
  overrides: Partial<IMstAdminRoleSubjectPermission> = {},
): IMstAdminRoleSubjectPermission {
  return {
    permissionId: 1,
    roleId: 1,
    subjectId: 1,
    actionId: 1,
    active: true,
    ...overrides,
  };
}

function createRoleAssignment(overrides: Partial<IRoleAssignment> = {}): IRoleAssignment {
  return {
    adminRolePermissionId: 1,
    roleId: 1,
    adminId: 100,
    active: true,
    role: { roleId: 1, role: 'Franchise Admin', roleCode: 'franchise_admin' },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Simulated PermissionResolutionService logic
// ---------------------------------------------------------------------------

/**
 * Mirrors the logic that the production PermissionResolutionService will implement:
 * 1. Load active role assignments for an admin
 * 2. For each role, load its subject-action permission rows
 * 3. Resolve subject codes and action codes from lookup tables
 * 4. Build the additive union dictionary
 */
function resolvePermissions(
  roleAssignments: IRoleAssignment[],
  allPermissions: IMstAdminRoleSubjectPermission[],
  subjects: IMstAdminSubject[],
  actions: IMstAdminAction[],
): IPermissionDictionary {
  const permissions: Record<string, Set<string>> = {};
  const subjectMeta: Record<string, { franchiseScoped: boolean }> = {};

  // Build lookup maps
  const subjectMap = new Map(subjects.filter((s) => s.active).map((s) => [s.subjectId, s]));
  const actionMap = new Map(actions.map((a) => [a.actionId, a]));

  // Only consider active role assignments
  const activeRoleIds = new Set(
    roleAssignments.filter((ra) => ra.active && ra.role).map((ra) => ra.roleId),
  );

  // Check for super-admin grant_all_on_new_subject flag
  const hasGrantAll = roleAssignments.some(
    (ra) => ra.active && ra.role?.grantAllOnNewSubject === true,
  );

  if (hasGrantAll) {
    // Super Admin: all active subjects x all actions
    for (const [, subject] of subjectMap) {
      if (subject.subjectCode === AdminSubjectEnum.All) continue;
      permissions[subject.subjectCode] = new Set(actions.map((a) => a.actionCode));
      subjectMeta[subject.subjectCode] = { franchiseScoped: subject.franchiseScoped };
    }
  } else {
    // Normal resolution: union permissions across all active roles
    for (const perm of allPermissions) {
      if (!perm.active) continue;
      if (!activeRoleIds.has(perm.roleId)) continue;

      const subject = subjectMap.get(perm.subjectId);
      const action = actionMap.get(perm.actionId);
      if (!subject || !action) continue;

      if (!permissions[subject.subjectCode]) {
        permissions[subject.subjectCode] = new Set();
      }
      permissions[subject.subjectCode].add(action.actionCode);
      subjectMeta[subject.subjectCode] = { franchiseScoped: subject.franchiseScoped };
    }
  }

  // Convert Sets to sorted arrays for consistency
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(permissions)) {
    result[key] = [...value].sort();
  }

  return { permissions: result, subjectMeta };
}

// ---------------------------------------------------------------------------
// Test data: standard actions (only 4 discrete, NO manage)
// ---------------------------------------------------------------------------

const STANDARD_ACTIONS: IMstAdminAction[] = [
  { actionId: 1, actionCode: AdminActionEnum.Read, actionName: 'Read' },
  { actionId: 2, actionCode: AdminActionEnum.Create, actionName: 'Create' },
  { actionId: 3, actionCode: AdminActionEnum.Update, actionName: 'Update' },
  { actionId: 4, actionCode: AdminActionEnum.Delete, actionName: 'Delete' },
];

const STANDARD_SUBJECTS: IMstAdminSubject[] = [
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
  describe('resolvePermissions', () => {
    it('should load permissions for a single role', () => {
      const roleAssignments = [
        createRoleAssignment({ roleId: 1, adminId: 100 }),
      ];

      const permissions = [
        createPermission({ permissionId: 1, roleId: 1, subjectId: 1, actionId: 1 }), // Member.Read
        createPermission({ permissionId: 2, roleId: 1, subjectId: 1, actionId: 2 }), // Member.Create
      ];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      expect(result.permissions[AdminSubjectEnum.Member]).toEqual([
        AdminActionEnum.Create,
        AdminActionEnum.Read,
      ]);
      expect(Object.keys(result.permissions)).toHaveLength(1);
    });

    it('should merge permissions across multiple roles (union)', () => {
      const roleAssignments = [
        createRoleAssignment({ roleId: 1, adminId: 100 }),
        createRoleAssignment({
          adminRolePermissionId: 2,
          roleId: 2,
          adminId: 100,
          role: { roleId: 2, role: 'Blog Admin', roleCode: 'blog_admin' },
        }),
      ];

      const permissions = [
        createPermission({ permissionId: 1, roleId: 1, subjectId: 1, actionId: 1 }), // Member.Read (role 1)
        createPermission({ permissionId: 2, roleId: 2, subjectId: 2, actionId: 1 }), // Blog.Read (role 2)
        createPermission({ permissionId: 3, roleId: 2, subjectId: 2, actionId: 2 }), // Blog.Create (role 2)
      ];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
      expect(result.permissions[AdminSubjectEnum.Blog]).toEqual([
        AdminActionEnum.Create,
        AdminActionEnum.Read,
      ]);
    });

    it('should build correct dictionary format: { "Member": ["read","create","update","delete"] }', () => {
      const roleAssignments = [createRoleAssignment({ roleId: 1 })];

      const permissions = [
        createPermission({ permissionId: 1, roleId: 1, subjectId: 1, actionId: 1 }),
        createPermission({ permissionId: 2, roleId: 1, subjectId: 1, actionId: 2 }),
        createPermission({ permissionId: 3, roleId: 1, subjectId: 1, actionId: 3 }),
        createPermission({ permissionId: 4, roleId: 1, subjectId: 1, actionId: 4 }),
      ];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      expect(result.permissions).toEqual({
        [AdminSubjectEnum.Member]: [
          AdminActionEnum.Create,
          AdminActionEnum.Delete,
          AdminActionEnum.Read,
          AdminActionEnum.Update,
        ],
      });
    });

    it('should include franchise_scoped metadata per subject', () => {
      const roleAssignments = [createRoleAssignment({ roleId: 1 })];

      const permissions = [
        createPermission({ permissionId: 1, roleId: 1, subjectId: 1, actionId: 1 }), // Member (scoped)
        createPermission({ permissionId: 2, roleId: 1, subjectId: 2, actionId: 1 }), // Blog (not scoped)
      ];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      expect(result.subjectMeta[AdminSubjectEnum.Member]).toEqual({
        franchiseScoped: true,
      });
      expect(result.subjectMeta[AdminSubjectEnum.Blog]).toEqual({
        franchiseScoped: false,
      });
    });

    it('should handle role with no permissions (empty dictionary)', () => {
      const roleAssignments = [createRoleAssignment({ roleId: 1 })];
      const permissions: IMstAdminRoleSubjectPermission[] = [];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      expect(result.permissions).toEqual({});
      expect(Object.keys(result.subjectMeta)).toHaveLength(0);
    });

    it('should handle user with no assigned roles', () => {
      const roleAssignments: IRoleAssignment[] = [];
      const permissions = [
        // Permissions exist in DB but not assigned to any active role for this user
        createPermission({ permissionId: 1, roleId: 99, subjectId: 1, actionId: 1 }),
      ];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      expect(result.permissions).toEqual({});
    });

    it('should not include inactive permission rows', () => {
      const roleAssignments = [createRoleAssignment({ roleId: 1 })];

      const permissions = [
        createPermission({
          permissionId: 1,
          roleId: 1,
          subjectId: 1,
          actionId: 1,
          active: true,
        }), // Member.Read — active
        createPermission({
          permissionId: 2,
          roleId: 1,
          subjectId: 1,
          actionId: 2,
          active: false,
        }), // Member.Create — INACTIVE
      ];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
    });

    it('should not include permissions for inactive roles', () => {
      const roleAssignments = [
        createRoleAssignment({ roleId: 1, active: true }),
        createRoleAssignment({
          adminRolePermissionId: 2,
          roleId: 2,
          active: false, // INACTIVE role assignment
          role: { roleId: 2, role: 'Blog Admin', roleCode: 'blog_admin' },
        }),
      ];

      const permissions = [
        createPermission({ permissionId: 1, roleId: 1, subjectId: 1, actionId: 1 }), // Member.Read — active role
        createPermission({ permissionId: 2, roleId: 2, subjectId: 2, actionId: 1 }), // Blog.Read — inactive role
        createPermission({ permissionId: 3, roleId: 2, subjectId: 2, actionId: 2 }), // Blog.Create — inactive role
      ];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
      expect(result.permissions[AdminSubjectEnum.Blog]).toBeUndefined();
    });

    it('should return all 4 actions when role has all 4 for a subject', () => {
      const roleAssignments = [createRoleAssignment({ roleId: 1 })];

      const permissions = STANDARD_ACTIONS.map((action, idx) =>
        createPermission({
          permissionId: idx + 1,
          roleId: 1,
          subjectId: 1,
          actionId: action.actionId,
        }),
      );

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      expect(result.permissions[AdminSubjectEnum.Member]).toEqual([
        AdminActionEnum.Create,
        AdminActionEnum.Delete,
        AdminActionEnum.Read,
        AdminActionEnum.Update,
      ]);
      expect(result.permissions[AdminSubjectEnum.Member]).toHaveLength(4);
    });

    it('should return sorted action arrays for consistency', () => {
      const roleAssignments = [createRoleAssignment({ roleId: 1 })];

      // Insert actions in non-alphabetical order
      const permissions = [
        createPermission({ permissionId: 1, roleId: 1, subjectId: 1, actionId: 4 }), // Delete
        createPermission({ permissionId: 2, roleId: 1, subjectId: 1, actionId: 1 }), // Read
        createPermission({ permissionId: 3, roleId: 1, subjectId: 1, actionId: 3 }), // Update
        createPermission({ permissionId: 4, roleId: 1, subjectId: 1, actionId: 2 }), // Create
      ];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      const actions = result.permissions[AdminSubjectEnum.Member];
      // Verify sorted alphabetically
      expect(actions).toEqual([...actions].sort());
    });

    it('should handle Super Admin with grant_all_on_new_subject having all subjects x all actions', () => {
      const roleAssignments = [
        createRoleAssignment({
          roleId: 1,
          role: {
            roleId: 1,
            role: 'Super Admin',
            roleCode: 'super_admin',
            grantAllOnNewSubject: true,
          },
        }),
      ];

      // No individual permission rows needed — grant_all_on_new_subject overrides
      const permissions: IMstAdminRoleSubjectPermission[] = [];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      // Every active subject should have all 4 actions
      const allSubjectCodes = STANDARD_SUBJECTS
        .filter((s) => s.active && s.subjectCode !== AdminSubjectEnum.All)
        .map((s) => s.subjectCode);

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

    it('should not include permissions for inactive subjects', () => {
      const roleAssignments = [createRoleAssignment({ roleId: 1 })];

      const subjectsWithInactive = [
        ...STANDARD_SUBJECTS,
        createSubject({
          subjectId: 99,
          subjectCode: 'DeprecatedFeature' as AdminSubjectEnum,
          subjectName: 'Deprecated Feature',
          active: false,
        }),
      ];

      const permissions = [
        createPermission({ permissionId: 1, roleId: 1, subjectId: 1, actionId: 1 }),
        createPermission({ permissionId: 2, roleId: 1, subjectId: 99, actionId: 1 }), // Inactive subject
      ];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        subjectsWithInactive,
        STANDARD_ACTIONS,
      );

      expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
      expect(result.permissions['DeprecatedFeature']).toBeUndefined();
    });

    it('should deduplicate permissions when same subject+action comes from multiple roles', () => {
      const roleAssignments = [
        createRoleAssignment({ roleId: 1 }),
        createRoleAssignment({
          adminRolePermissionId: 2,
          roleId: 2,
          role: { roleId: 2, role: 'Blog Admin', roleCode: 'blog_admin' },
        }),
      ];

      const permissions = [
        createPermission({ permissionId: 1, roleId: 1, subjectId: 1, actionId: 1 }), // Member.Read (role 1)
        createPermission({ permissionId: 2, roleId: 2, subjectId: 1, actionId: 1 }), // Member.Read (role 2) — duplicate
        createPermission({ permissionId: 3, roleId: 2, subjectId: 1, actionId: 2 }), // Member.Create (role 2)
      ];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      // Member.Read should appear only once in the array
      expect(result.permissions[AdminSubjectEnum.Member]).toEqual([
        AdminActionEnum.Create,
        AdminActionEnum.Read,
      ]);
    });

    it('should silently skip permission row with non-existent subjectId', () => {
      const roleAssignments = [createRoleAssignment({ roleId: 1 })];

      const permissions = [
        createPermission({ permissionId: 1, roleId: 1, subjectId: 1, actionId: 1 }), // Member.Read — valid
        createPermission({ permissionId: 2, roleId: 1, subjectId: 999, actionId: 1 }), // subjectId 999 does not exist
      ];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      // Only valid permission should appear; non-existent subject silently skipped
      expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
      expect(Object.keys(result.permissions)).toHaveLength(1);
    });

    it('should silently skip permission row with non-existent actionId', () => {
      const roleAssignments = [createRoleAssignment({ roleId: 1 })];

      const permissions = [
        createPermission({ permissionId: 1, roleId: 1, subjectId: 1, actionId: 1 }), // Member.Read — valid
        createPermission({ permissionId: 2, roleId: 1, subjectId: 1, actionId: 999 }), // actionId 999 does not exist
      ];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      // Only the valid action should appear
      expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
    });

    it('should filter out role assignment with null role relation', () => {
      const roleAssignments = [
        createRoleAssignment({ roleId: 1 }),
        createRoleAssignment({
          adminRolePermissionId: 2,
          roleId: 2,
          active: true,
          role: null as unknown as IRoleAssignment['role'], // null role relation
        }),
      ];

      const permissions = [
        createPermission({ permissionId: 1, roleId: 1, subjectId: 1, actionId: 1 }), // Member.Read (role 1)
        createPermission({ permissionId: 2, roleId: 2, subjectId: 2, actionId: 1 }), // Blog.Read (role 2 — null role)
      ];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      // Role 2 has null role relation so it should be filtered out by `ra.active && ra.role` check
      expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
      expect(result.permissions[AdminSubjectEnum.Blog]).toBeUndefined();
    });

    it('should treat Super Admin WITHOUT grantAllOnNewSubject as normal role', () => {
      const roleAssignments = [
        createRoleAssignment({
          roleId: 1,
          role: {
            roleId: 1,
            role: 'Super Admin',
            roleCode: 'super_admin',
            grantAllOnNewSubject: false, // explicitly false
          },
        }),
      ];

      // Only one explicit permission row
      const permissions = [
        createPermission({ permissionId: 1, roleId: 1, subjectId: 1, actionId: 1 }), // Member.Read
      ];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      // Should NOT get all subjects x all actions — only the explicit Member.Read
      expect(result.permissions[AdminSubjectEnum.Member]).toEqual([AdminActionEnum.Read]);
      expect(Object.keys(result.permissions)).toHaveLength(1);
    });

    it('should trigger grant-all when any role has grantAllOnNewSubject (mixed roles)', () => {
      const roleAssignments = [
        createRoleAssignment({
          roleId: 1,
          role: {
            roleId: 1,
            role: 'Franchise Admin',
            roleCode: 'franchise_admin',
            grantAllOnNewSubject: false,
          },
        }),
        createRoleAssignment({
          adminRolePermissionId: 2,
          roleId: 2,
          role: {
            roleId: 2,
            role: 'Super Admin',
            roleCode: 'super_admin',
            grantAllOnNewSubject: true, // one role has the flag
          },
        }),
      ];

      const permissions: IMstAdminRoleSubjectPermission[] = [];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        STANDARD_SUBJECTS,
        STANDARD_ACTIONS,
      );

      // Any role with grantAllOnNewSubject triggers full access across all subjects
      const allSubjectCodes = STANDARD_SUBJECTS
        .filter((s) => s.active && s.subjectCode !== AdminSubjectEnum.All)
        .map((s) => s.subjectCode);

      for (const subjectCode of allSubjectCodes) {
        expect(result.permissions[subjectCode]).toEqual([
          AdminActionEnum.Create,
          AdminActionEnum.Delete,
          AdminActionEnum.Read,
          AdminActionEnum.Update,
        ]);
      }
    });

    it('should NOT include AdminSubjectEnum.All in Super Admin permission dictionary', () => {
      const subjectsWithAll = [
        ...STANDARD_SUBJECTS,
        createSubject({
          subjectId: 100,
          subjectCode: AdminSubjectEnum.All,
          subjectName: 'All',
          franchiseScoped: false,
        }),
      ];

      const roleAssignments = [
        createRoleAssignment({
          roleId: 1,
          role: {
            roleId: 1,
            role: 'Super Admin',
            roleCode: 'super_admin',
            grantAllOnNewSubject: true,
          },
        }),
      ];

      const permissions: IMstAdminRoleSubjectPermission[] = [];

      const result = resolvePermissions(
        roleAssignments,
        permissions,
        subjectsWithAll,
        STANDARD_ACTIONS,
      );

      // The 'all' subject code (CASL wildcard) must be excluded from the output
      expect(result.permissions[AdminSubjectEnum.All]).toBeUndefined();
      expect(result.subjectMeta[AdminSubjectEnum.All]).toBeUndefined();
    });
  });
});
