import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  MstAdminRole,
  MstAdminRolePermission,
  MstAdminUser,
  TxnAdminFranchise,
} from '../database/models';
import { IAuthUser } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil } from '../utils/common-functions.utils';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectModel(MstAdminUser) private readonly adminRepository: typeof MstAdminUser,
    @InjectModel(MstAdminRolePermission) private readonly rolePermRepository: typeof MstAdminRolePermission,
    @InjectModel(TxnAdminFranchise) private readonly adminFranchiseRepository: typeof TxnAdminFranchise,
  ) {}

  async findById(adminId: number): Promise<MstAdminUser | null> {
    return await this.adminRepository.findOne({
      where: { adminId: adminId },
    });
  }

  /**
   * Full session user for JWT validate and /auth/profile:
   * profile fields, role codes, and franchise scope (user.franchise_id ∪ txn_admin_franchises).
   */
  async findAuthUserForSession(adminId: number): Promise<IAuthUser | null> {
    const adminUser = await this.adminRepository.findOne({
      where: { adminId },
    });
    if (!adminUser || !adminUser.active) {
      return null;
    }

    const [roleRows, franchiseRows] = await Promise.all([
      this.rolePermRepository.findAll({
        where: { adminId, active: true },
        include: [
          {
            model: MstAdminRole,
            as: 'role',
            attributes: ['roleCode'],
            required: true,
          },
        ],
      }),
      this.adminFranchiseRepository.findAll({
        where: { adminId },
        attributes: ['franchiseId'],
      }),
    ]);

    const roleKeys = [
      ...new Set(
        roleRows
          .map((r) => r.role?.roleCode)
          .filter((c): c is string => typeof c === 'string' && c.length > 0),
      ),
    ];

    const franchiseIdSet = new Set<number>();
    if (adminUser.franchiseId != null) {
      franchiseIdSet.add(adminUser.franchiseId);
    }
    for (const row of franchiseRows) {
      franchiseIdSet.add(row.franchiseId);
    }
    const franchiseIds = [...franchiseIdSet].sort((a, b) => a - b);

    return {
      adminId: adminUser.adminId,
      adminUserId: adminUser.adminId,
      emailId: adminUser.emailId,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      profilePicture: CommonFunctionsUtil.safeParse(adminUser.profilePicture),
      countryCode: adminUser.countryCode,
      contactNumber: adminUser.contactNumber,
      roleKeys,
      franchiseIds,
    };
  }

  /**
   * Batch role keys + franchise scope for many admins (list/grid) — avoids N+1 per row.
   */
  async findRoleScopesForAdminIds(
    adminIds: number[],
  ): Promise<Map<number, { roleKeys: string[]; franchiseIds: number[] }>> {
    const map = new Map<number, { roleKeys: string[]; franchiseIds: number[] }>();
    if (adminIds.length === 0) {
      return map;
    }
    const uniqueIds = [...new Set(adminIds)];
    for (const id of uniqueIds) {
      map.set(id, { roleKeys: [], franchiseIds: [] });
    }

    const [users, roleRows, txnRows] = await Promise.all([
      this.adminRepository.findAll({
        where: { adminId: uniqueIds },
        attributes: ['adminId', 'franchiseId'],
        raw: true,
      }),
      this.rolePermRepository.findAll({
        where: { adminId: uniqueIds, active: true },
        include: [
          {
            model: MstAdminRole,
            as: 'role',
            attributes: ['roleCode'],
            required: true,
          },
        ],
      }),
      this.adminFranchiseRepository.findAll({
        where: { adminId: uniqueIds },
        attributes: ['adminId', 'franchiseId'],
        raw: true,
      }),
    ]);

    for (const u of users as { adminId: number; franchiseId: number | null }[]) {
      const entry = map.get(u.adminId);
      if (entry && u.franchiseId != null && !entry.franchiseIds.includes(u.franchiseId)) {
        entry.franchiseIds.push(u.franchiseId);
      }
    }

    for (const row of roleRows) {
      const code = row.role?.roleCode;
      const entry = map.get(row.adminId);
      if (entry && typeof code === 'string' && code.length > 0 && !entry.roleKeys.includes(code)) {
        entry.roleKeys.push(code);
      }
    }

    for (const row of txnRows as { adminId: number; franchiseId: number }[]) {
      const entry = map.get(row.adminId);
      if (entry && !entry.franchiseIds.includes(row.franchiseId)) {
        entry.franchiseIds.push(row.franchiseId);
      }
    }

    for (const [, v] of map) {
      v.franchiseIds.sort((a, b) => a - b);
      v.roleKeys.sort();
    }

    return map;
  }
}
