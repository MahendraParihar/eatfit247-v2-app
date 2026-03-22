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
}
