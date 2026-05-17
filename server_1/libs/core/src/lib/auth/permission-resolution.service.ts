import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AdminSubjectEnum } from '@eatfit247-shared-lib';
import { TxnAdminUserRole } from '../database/models/admin/mst-admin-role-permission.model';
import { MstAdminRole } from '../database/models/admin/mst-admin-role.model';
import { MstAdminSubject } from '../database/models/admin/mst-admin-subject.model';
import { MstAdminAction } from '../database/models/admin/mst-admin-action.model';
import { MstAdminRoleSubjectPermission } from '../database/models/admin/mst-admin-role-subject-permission.model';
import { MstAdminUser } from '../database/models/admin/mst-admin-user.model';
import { TxnAdminFranchise } from '../database/models/admin/txn-admin-franchise.model';
import { ICachedPermissions } from './rbac.interfaces';

@Injectable()
export class PermissionResolutionService {
  constructor(
    @InjectModel(TxnAdminUserRole)
    private readonly userRoleRepository: typeof TxnAdminUserRole,
    @InjectModel(MstAdminRoleSubjectPermission)
    private readonly roleSubjectPermRepository: typeof MstAdminRoleSubjectPermission,
    @InjectModel(MstAdminSubject)
    private readonly subjectRepository: typeof MstAdminSubject,
    @InjectModel(MstAdminAction)
    private readonly actionRepository: typeof MstAdminAction,
    @InjectModel(MstAdminUser)
    private readonly adminRepository: typeof MstAdminUser,
    @InjectModel(TxnAdminFranchise)
    private readonly adminFranchiseRepository: typeof TxnAdminFranchise,
  ) {}

  async resolveForAdmin(adminId: number): Promise<ICachedPermissions> {
    // 1. Load active role assignments with role details
    const roleAssignments = await this.userRoleRepository.findAll({
      where: { adminId, active: true },
      include: [
        {
          model: MstAdminRole,
          as: 'role',
          attributes: ['roleId', 'role', 'roleCode', 'grantAllOnNewSubject'],
          required: true,
        },
      ],
    });

    // Build roles array for the response
    const roles = roleAssignments
      .filter((ra) => ra.role)
      .map((ra) => ({
        roleId: ra.role.roleId,
        role: ra.role.role,
        roleCode: ra.role.roleCode,
      }));

    // 2. Load franchise IDs
    const franchiseIds = await this.loadFranchiseIds(adminId);

    // 3. Load all active subjects and actions
    const [subjects, actions] = await Promise.all([
      this.subjectRepository.findAll({ where: { active: true } }),
      this.actionRepository.findAll(),
    ]);

    // Build lookup maps
    const subjectMap = new Map(subjects.map((s) => [s.subjectId, s]));
    const actionMap = new Map(actions.map((a) => [a.actionId, a]));

    // 4. Check for grant_all_on_new_subject (Super Admin fast path)
    const hasGrantAll = roleAssignments.some(
      (ra) => ra.role?.grantAllOnNewSubject === true,
    );

    const permissions: Record<string, Set<string>> = {};
    const subjectMeta: Record<string, { franchiseScoped: boolean }> = {};

    if (hasGrantAll) {
      // Super Admin: all active subjects x all actions
      for (const [, subject] of subjectMap) {
        if (subject.subjectCode === AdminSubjectEnum.All) continue;
        permissions[subject.subjectCode] = new Set(actions.map((a) => a.actionCode));
        subjectMeta[subject.subjectCode] = { franchiseScoped: subject.franchiseScoped };
      }
    } else {
      // Normal resolution: load permission rows for all active role IDs
      const activeRoleIds = roleAssignments
        .filter((ra) => ra.role)
        .map((ra) => ra.roleId);

      if (activeRoleIds.length > 0) {
        const permissionRows = await this.roleSubjectPermRepository.findAll({
          where: { roleId: activeRoleIds, active: true },
        });

        for (const perm of permissionRows) {
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
    }

    // Convert Sets to sorted arrays for consistency
    const permissionsResult: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(permissions)) {
      permissionsResult[key] = [...value].sort();
    }

    return {
      adminId,
      roles,
      permissions: permissionsResult,
      franchiseIds,
      subjectMeta,
    };
  }

  private async loadFranchiseIds(adminId: number): Promise<number[]> {
    const [adminUser, franchiseRows] = await Promise.all([
      this.adminRepository.findOne({
        where: { adminId },
        attributes: ['adminId', 'franchiseId'],
      }),
      this.adminFranchiseRepository.findAll({
        where: { adminId },
        attributes: ['franchiseId'],
      }),
    ]);

    const franchiseIdSet = new Set<number>();
    if (adminUser?.franchiseId != null) {
      franchiseIdSet.add(adminUser.franchiseId);
    }
    for (const row of franchiseRows) {
      franchiseIdSet.add(row.franchiseId);
    }
    return [...franchiseIdSet].sort((a, b) => a - b);
  }
}
