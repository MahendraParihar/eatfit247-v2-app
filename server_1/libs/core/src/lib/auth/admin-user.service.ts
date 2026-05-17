import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  MstAdminRole,
  MstAdminUser,
  TxnAdminFranchise,
  TxnAdminUserRole,
} from '../database/models';
import { IAuthUser } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil } from '../utils/common-functions.utils';
import { RbacCacheService } from './rbac-cache.service';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectModel(MstAdminUser) private readonly adminRepository: typeof MstAdminUser,
    @InjectModel(TxnAdminUserRole) private readonly rolePermRepository: typeof TxnAdminUserRole,
    @InjectModel(TxnAdminFranchise) private readonly adminFranchiseRepository: typeof TxnAdminFranchise,
    private readonly rbacCacheService: RbacCacheService,
  ) {}

  async findById(adminId: number): Promise<MstAdminUser | null> {
    return await this.adminRepository.findOne({
      where: { adminId: adminId },
    });
  }

  /**
   * Full session user for JWT validate and /auth/profile:
   * profile fields, DB-driven permissions (via Redis cache), and franchise scope.
   */
  async findAuthUserForSession(adminId: number): Promise<IAuthUser | null> {
    const adminUser = await this.adminRepository.findOne({
      where: { adminId },
    });
    if (!adminUser || !adminUser.active) {
      return null;
    }

    // Load permissions from Redis cache (falls back to DB on cache miss)
    const cachedPermissions = await this.rbacCacheService.getPermissions(adminId);

    // Derive roleKeys for backward compat
    const roleKeys = cachedPermissions?.roles.map((r) => r.roleCode) ?? [];

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
      franchiseIds: cachedPermissions?.franchiseIds ?? [],
      roles: cachedPermissions?.roles,
      permissions: cachedPermissions?.permissions,
      subjectMeta: cachedPermissions?.subjectMeta,
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
