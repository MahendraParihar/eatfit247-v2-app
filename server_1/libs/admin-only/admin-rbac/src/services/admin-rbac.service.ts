import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Order } from 'sequelize';
import {
  IAdminRole,
  IAdminSubject,
  IBasicSearch,
  IPermissionMatrix,
  ITableList,
} from '@eatfit247-shared-lib';
import {
  MstAdminAction,
  MstAdminRole,
  MstAdminRoleSubjectPermission,
  MstAdminSubject,
  RbacCacheService,
  TableListSortUtil,
  TxnAdminUserRole,
} from '@server_1/core';
import { CreateAdminRoleDto, UpdatePermissionMatrixDto } from '../dto';

@Injectable()
export class AdminRbacService {
  constructor(
    @InjectModel(MstAdminRole)
    private readonly roleRepository: typeof MstAdminRole,
    @InjectModel(MstAdminSubject)
    private readonly subjectRepository: typeof MstAdminSubject,
    @InjectModel(MstAdminAction)
    private readonly actionRepository: typeof MstAdminAction,
    @InjectModel(MstAdminRoleSubjectPermission)
    private readonly permissionRepository: typeof MstAdminRoleSubjectPermission,
    @InjectModel(TxnAdminUserRole)
    private readonly userRoleRepository: typeof TxnAdminUserRole,
    private readonly rbacCacheService: RbacCacheService,
  ) {}

  // ─── Role CRUD ───────────────────────────────────────────────────────

  async findAllRoles(searchDto: IBasicSearch): Promise<ITableList<IAdminRole>> {
    const whereCondition: any = {};
    if (searchDto.search) {
      whereCondition[Op.or] = [
        { role: { [Op.iLike]: `%${searchDto.search}%` } },
        { roleCode: { [Op.iLike]: `%${searchDto.search}%` } },
      ];
    }

    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const order = TableListSortUtil.orderFromAllowlist(
      searchDto,
      new Set(['roleId', 'role', 'roleCode', 'grantAllOnNewSubject', 'createdAt']),
      [['role', 'ASC']] as Order,
    );

    const { rows, count } = await this.roleRepository.findAndCountAll({
      where: whereCondition,
      order,
      offset,
      limit: pageSize,
    });

    const tableData: IAdminRole[] = rows.map((r) => ({
      roleId: r.roleId,
      role: r.role,
      roleCode: r.roleCode,
      grantAllOnNewSubject: r.grantAllOnNewSubject,
      createdAt: r.createdAt,
    }));

    return { tableData, count };
  }

  async fetchRoleById(id: number): Promise<IAdminRole> {
    const role = await this.roleRepository.findByPk(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return {
      roleId: role.roleId,
      role: role.role,
      roleCode: role.roleCode,
      grantAllOnNewSubject: role.grantAllOnNewSubject,
      createdAt: role.createdAt,
    };
  }

  async createRole(dto: CreateAdminRoleDto): Promise<IAdminRole> {
    // Check uniqueness of roleCode
    const existing = await this.roleRepository.findOne({
      where: { roleCode: dto.roleCode },
    });
    if (existing) {
      throw new BadRequestException(`Role code "${dto.roleCode}" already exists`);
    }

    const role = await this.roleRepository.create({
      role: dto.role,
      roleCode: dto.roleCode,
      grantAllOnNewSubject: dto.grantAllOnNewSubject ?? false,
    } as any);

    return {
      roleId: role.roleId,
      role: role.role,
      roleCode: role.roleCode,
      grantAllOnNewSubject: role.grantAllOnNewSubject,
      createdAt: role.createdAt,
    };
  }

  async updateRole(id: number, dto: CreateAdminRoleDto): Promise<void> {
    const role = await this.roleRepository.findByPk(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check uniqueness of roleCode (exclude self)
    const duplicate = await this.roleRepository.findOne({
      where: { roleCode: dto.roleCode, roleId: { [Op.ne]: id } },
    });
    if (duplicate) {
      throw new BadRequestException(`Role code "${dto.roleCode}" already exists`);
    }

    await role.update({
      role: dto.role,
      roleCode: dto.roleCode,
      grantAllOnNewSubject: dto.grantAllOnNewSubject ?? role.grantAllOnNewSubject,
    });
  }

  // ─── Subject Listing (read-only) ────────────────────────────────────

  async findAllSubjects(): Promise<IAdminSubject[]> {
    const rows = await this.subjectRepository.findAll({
      where: { active: true },
      order: [['subjectName', 'ASC']],
    });

    return rows.map((s) => ({
      subjectId: s.subjectId,
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      franchiseScoped: s.franchiseScoped,
      active: s.active,
      createdAt: s.createdAt,
    }));
  }

  // ─── Permission Matrix ──────────────────────────────────────────────

  async getPermissionMatrix(roleId: number): Promise<IPermissionMatrix> {
    // Verify role exists
    const role = await this.roleRepository.findByPk(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const [subjects, actions, permissionRows] = await Promise.all([
      this.subjectRepository.findAll({
        where: { active: true },
        order: [['subjectName', 'ASC']],
      }),
      this.actionRepository.findAll({
        order: [['actionId', 'ASC']],
      }),
      this.permissionRepository.findAll({
        where: { roleId, active: true },
      }),
    ]);

    return {
      subjects: subjects.map((s) => ({
        subjectId: s.subjectId,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        franchiseScoped: s.franchiseScoped,
        active: s.active,
        createdAt: s.createdAt,
      })),
      actions: actions.map((a) => ({
        actionId: a.actionId,
        actionCode: a.actionCode,
        actionName: a.actionName,
      })),
      grants: permissionRows.map((p) => ({
        subjectId: p.subjectId,
        actionId: p.actionId,
      })),
    };
  }

  async savePermissionMatrix(
    roleId: number,
    dto: UpdatePermissionMatrixDto,
    ip: string,
    adminId: number,
  ): Promise<void> {
    // Verify role exists
    const role = await this.roleRepository.findByPk(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const sequelize = this.roleRepository.sequelize;
    if (!sequelize) {
      throw new BadRequestException('Database connection unavailable');
    }

    await sequelize.transaction(async (transaction) => {
      // Delete all existing permissions for this role
      await this.permissionRepository.destroy({
        where: { roleId },
        transaction,
      });

      // Bulk-insert new grants
      if (dto.grants.length > 0) {
        const now = new Date();
        await this.permissionRepository.bulkCreate(
          dto.grants.map((g) => ({
            roleId,
            subjectId: g.subjectId,
            actionId: g.actionId,
            active: true,
            createdBy: adminId,
            modifiedBy: adminId,
            createdIp: ip,
            modifiedIp: ip,
            createdAt: now,
            updatedAt: now,
          })),
          { transaction },
        );
      }
    });

    // Invalidate Redis cache for all users holding this role
    await this.invalidateCacheForRole(roleId);
  }

  private async invalidateCacheForRole(roleId: number): Promise<void> {
    const userRoles = await this.userRoleRepository.findAll({
      where: { roleId, active: true },
      attributes: ['adminId'],
    });

    const adminIds = [...new Set(userRoles.map((ur) => ur.adminId))];
    if (adminIds.length > 0) {
      await this.rbacCacheService.invalidatePermissions(adminIds);
    }
  }
}
