import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  MstAdminRole,
  MstAdminRolePermission,
  MstAdminUser,
  MstFranchise,
} from '../database/models';
import { IAdminUser } from '@eatfit247-shared-lib';

@Injectable()
export class AdminUserService {
  constructor(@InjectModel(MstAdminUser) private readonly adminRepository: typeof MstAdminUser) {}

  async findById(adminId: number): Promise<MstAdminUser | null> {
    return await this.adminRepository.findOne({
      where: { adminId: adminId },
    });
  }

  // async buildUserWithPermissions(adminId: number): Promise<IAdminUser | null> {
  //   const adminUser = await this.adminRepository.findOne({
  //     where: { adminId: adminId },
  //     include: [
  //       {
  //         model: MstAdminRolePermission,
  //         include: [
  //           {
  //             model: MstAdminRole,
  //             attributes: ['roleKey'],
  //             include: [
  //               {
  //                 model: MstAdminRolePermission,
  //                 attributes: ['action', 'subject', 'conditions'],
  //               },
  //             ],
  //           },
  //         ],
  //       },
  //       {
  //         model: MstFranchise,
  //         attributes: ['franchiseId'],
  //       },
  //     ],
  //   });
  //
  //   if (!adminUser) throw new UnauthorizedException();
  //
  //   // Flatten all roles and all permissions from all roles
  //   const roleKeys = adminUser.userRoles?.map((ur) => ur.role?.role_key) ?? [];
  //   const permissions =
  //     adminUser.userRoles?.flatMap(
  //       (ur) =>
  //         ur.role?.permissions?.map((p) => ({
  //           action: p.action,
  //           subject: p.subject,
  //           conditions: p.conditions,
  //         })) ?? [],
  //     ) ?? [];
  //
  //   return {
  //     adminUserId: adminUser.admin_user_id,
  //     name: adminUser.name,
  //     email: adminUser.email,
  //     roleKeys, // ← array
  //     franchiseIds: adminUser.franchises?.map((f) => f.franchise_id) ?? [],
  //     permissions,
  //     isActive: adminUser.is_active,
  //   };
  // }
}
