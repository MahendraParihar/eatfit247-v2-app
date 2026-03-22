import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  IAdminUser,
  IBasicSearch,
  IDropdownItem,
  IManageAddress,
  IManageAdminUser,
  ITableList,
  TableEnum,
} from '@eatfit247-shared-lib';
import {
  AdminUserService as CoreSessionAdminService,
  AppConfigService,
  CommonFunctionsUtil,
  CryptoUtil,
  generateRandomPassword,
  MstAdminRole,
  MstAdminRolePermission,
  MstAdminUser,
  TxnAdminFranchise,
} from '@server_1/core';
import { AddressService } from '@server_1/platform';
import { Op } from 'sequelize';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectModel(MstAdminUser) private readonly adminUserRepository: typeof MstAdminUser,
    @InjectModel(MstAdminRolePermission)
    private readonly rolePermissionRepository: typeof MstAdminRolePermission,
    @InjectModel(MstAdminRole) private readonly adminRoleRepository: typeof MstAdminRole,
    @InjectModel(TxnAdminFranchise)
    private readonly adminFranchiseRepository: typeof TxnAdminFranchise,
    private appConfigService: AppConfigService,
    private addressService: AddressService,
    private readonly coreSessionAdmin: CoreSessionAdminService,
  ) {}

  /**
   * Whether franchise scope was included in the payload (then we replace txn + primary column).
   */
  private franchiseScopeFromPayload(obj: IManageAdminUser): {
    effective: number[];
    apply: boolean;
  } {
    if (obj.franchiseIds !== undefined && Array.isArray(obj.franchiseIds)) {
      const effective = [
        ...new Set(
          obj.franchiseIds.map((id) => Number(id)).filter((n) => Number.isInteger(n) && n > 0),
        ),
      ].sort((a, b) => a - b);
      return { effective, apply: true };
    }
    return { effective: [], apply: false };
  }

  private async syncAdminFranchises(
    targetAdminId: number,
    franchiseIds: number[],
    cIp: string,
    actorAdminId: number,
  ): Promise<void> {
    const sequelize = this.adminUserRepository.sequelize;
    if (!sequelize) {
      throw new BadRequestException('Database connection unavailable');
    }
    await sequelize.transaction(async (transaction) => {
      await this.adminFranchiseRepository.destroy({
        where: { adminId: targetAdminId },
        transaction,
      });
      if (franchiseIds.length === 0) {
        return;
      }
      const now = new Date();
      await this.adminFranchiseRepository.bulkCreate(
        franchiseIds.map((franchiseId) => ({
          adminId: targetAdminId,
          franchiseId,
          createdBy: actorAdminId,
          modifiedBy: actorAdminId,
          createdIp: cIp,
          modifiedIp: cIp,
          createdAt: now,
          updatedAt: now,
        })),
        { transaction },
      );
    });
  }

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IAdminUser>> {
    const whereCondition: any = {};
    if (searchDto.name) {
      whereCondition[Op.or] = [
        { firstName: { [Op.iLike]: `%${searchDto.name}%` } },
        { lastName: { [Op.iLike]: `%${searchDto.name}%` } },
        { emailId: { [Op.iLike]: `%${searchDto.name}%` } },
      ];
    }
    if (searchDto.search) {
      whereCondition[Op.or] = [
        { firstName: { [Op.iLike]: `%${searchDto.search}%` } },
        { lastName: { [Op.iLike]: `%${searchDto.search}%` } },
        { emailId: { [Op.iLike]: `%${searchDto.search}%` } },
        { contactNumber: { [Op.iLike]: `%${searchDto.search}%` } },
      ];
    }
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.adminUserRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [
        ['firstName', 'ASC'],
        ['lastName', 'ASC'],
      ],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IAdminUser[] = rows.map((item: MstAdminUser) => {
      return this.convertToModel(item);
    });
    if (searchDto.includeAdminRoles && resList.length > 0) {
      const scopes = await this.coreSessionAdmin.findRoleScopesForAdminIds(
        resList.map((r) => r.adminId),
      );
      for (const row of resList) {
        const s = scopes.get(row.adminId);
        if (s) {
          row.roleKeys = s.roleKeys;
          row.franchiseIds = s.franchiseIds;
        }
      }
    }
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IAdminUser {
    return <IAdminUser>{
      adminId: item.adminId,
      id: item.adminId,
      firstName: item.firstName,
      lastName: item.lastName,
      profilePicture: CommonFunctionsUtil.buildImageUrl(item.profilePicture),
      countryCode: item.countryCode,
      contactNumber: item.contactNumber,
      emailId: item.emailId,
      addressId: item.addressId,
      startDate: item.startDate,
      endDate: item.endDate,
      active: item.active !== undefined ? item.active : true,
      deactivationReason: item.deactivationReason,
      verificationCode: item.verificationCode,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
      franchiseIds: item.franchiseId != null ? [item.franchiseId] : [],
      permissions: [],
      roleKeys: [],
    };
  }

  public async fetchById(id: number): Promise<IAdminUser> {
    const find = await this.adminUserRepository.scope('details').findOne({
      where: { adminId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Admin user not found');
    }
    const adminUser = this.convertToModel(find);
    const session = await this.coreSessionAdmin.findAuthUserForSession(id);
    if (session) {
      adminUser.roleKeys = session.roleKeys;
      adminUser.franchiseIds = session.franchiseIds;
    }
    // Fetch address data
    const address = await this.addressService.findByTableIdAndPk(TableEnum.TXN_ADMIN, id);
    if (address) {
      adminUser.address = address;
    }
    const rolePermRows = await this.rolePermissionRepository.findAll({
      where: { adminId: id, active: true },
      attributes: ['roleId'],
      raw: true,
    });
    adminUser.roleIds = rolePermRows.map((r: { roleId: number }) => r.roleId);
    return adminUser;
  }

  public async create(obj: IManageAdminUser, cIp: string, adminId: number): Promise<void> {
    // Check if email already exists
    const existingUser = await this.adminUserRepository.findOne({
      where: { emailId: obj.emailId },
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }
    // Check if a contact number already exists
    const existingContact = await this.adminUserRepository.findOne({
      where: { contactNumber: obj.contactNumber },
    });
    if (existingContact) {
      throw new BadRequestException('Contact number already exists');
    }
    // Hash password if provided
    let hashedPassword = '';
    if (obj.password) {
      hashedPassword = await CryptoUtil.generateHash(obj.password);
    } else {
      // Generate a temporary password if not provided
      const tempPassword = generateRandomPassword();
      hashedPassword = await CryptoUtil.generateHash(tempPassword);
    }
    const { effective, apply } = this.franchiseScopeFromPayload(obj);
    const franchiseListForTxn = apply ? effective : [];
    const primaryFranchiseId = franchiseListForTxn[0] ?? null;

    const createObj = {
      firstName: obj.firstName,
      lastName: obj.lastName,
      profilePicture:
        obj.profilePicture && obj.profilePicture.length > 0 ? obj.profilePicture : null,
      password: hashedPassword,
      passwordTemp: hashedPassword,
      countryCode: obj.countryCode,
      contactNumber: obj.contactNumber,
      emailId: obj.emailId,
      startDate: obj.startDate,
      endDate: obj.endDate || null,
      franchiseId: primaryFranchiseId,
      active: obj.active !== undefined ? obj.active : true,
      deactivationReason: obj.deactivationReason || null,
      verificationCode: obj.verificationCode || null,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    const newAdminUser = await this.adminUserRepository.create(createObj);
    await this.syncAdminFranchises(newAdminUser.adminId, franchiseListForTxn, cIp, adminId);
    // Create address if provided
    if (obj.address) {
      const addressData: IManageAddress = obj.address;
      addressData.tableId = addressData.tableId || TableEnum.TXN_ADMIN;
      addressData.pkOfTable = newAdminUser.adminId;
      await this.addressService.createOrUpdate(addressData, cIp, adminId);
    }
    // Create role permissions if provided
    if (obj.roleIds && obj.roleIds.length > 0) {
      const rolePermissions = obj.roleIds.map((roleId) => ({
        roleId: roleId,
        adminId: newAdminUser.adminId,
        active: true,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      }));
      await this.rolePermissionRepository.bulkCreate(rolePermissions);
    }
  }

  public async update(
    id: number,
    obj: IManageAdminUser,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.adminUserRepository.findOne({ where: { adminId: id } });
    if (!find) {
      throw new NotFoundException('Admin user not found');
    }
    // Check if email already exists for another user
    if (obj.emailId && obj.emailId !== find.emailId) {
      const existingUser = await this.adminUserRepository.findOne({
        where: { emailId: obj.emailId },
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }
    // Check if a contact number already exists for another user
    if (obj.contactNumber && obj.contactNumber !== find.contactNumber) {
      const existingContact = await this.adminUserRepository.findOne({
        where: { contactNumber: obj.contactNumber },
      });
      if (existingContact) {
        throw new BadRequestException('Contact number already exists');
      }
    }
    const { effective, apply } = this.franchiseScopeFromPayload(obj);

    const updateObj: any = {
      firstName: obj.firstName,
      lastName: obj.lastName,
      countryCode: obj.countryCode,
      contactNumber: obj.contactNumber,
      emailId: obj.emailId,
      startDate: obj.startDate,
      endDate: obj.endDate || null,
      active: obj.active !== undefined ? obj.active : true,
      deactivationReason: obj.deactivationReason || null,
      verificationCode: obj.verificationCode || null,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    if (apply) {
      updateObj.franchiseId = effective[0] ?? null;
    }
    // Update password if provided
    if (obj.password) {
      const hashedPassword = await CryptoUtil.generateHash(obj.password);
      updateObj.password = hashedPassword;
      updateObj.passwordTemp = hashedPassword;
    }
    // Update setting picture if provided
    if (obj.profilePicture && obj.profilePicture.length > 0) {
      updateObj.profilePicture = obj.profilePicture;
    }
    await this.adminUserRepository.update(updateObj, { where: { adminId: id } });
    if (apply) {
      await this.syncAdminFranchises(id, effective, cIp, adminId);
    }
    // Update address if provided
    if (obj.address) {
      const addressData: IManageAddress = obj.address;
      addressData.tableId = addressData.tableId || TableEnum.TXN_ADMIN;
      addressData.pkOfTable = id;
      await this.addressService.createOrUpdate(addressData, cIp, adminId);
    }
    // Update role permissions if provided
    if (obj.roleIds !== undefined) {
      // Delete existing role permissions
      await this.rolePermissionRepository.destroy({ where: { adminId: id } });
      // Create new role permissions
      if (obj.roleIds.length > 0) {
        const rolePermissions = obj.roleIds.map((roleId) => ({
          roleId: roleId,
          adminId: id,
          active: true,
          createdBy: adminId,
          modifiedBy: adminId,
          createdIp: cIp,
          modifiedIp: cIp,
        }));
        await this.rolePermissionRepository.bulkCreate(rolePermissions);
      }
    }
  }

  public async changeStatus(
    id: number,
    active: boolean,
    deactivationReason: string | null,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.adminUserRepository.findOne({ where: { adminId: id } });
    if (!find) {
      throw new NotFoundException('Admin user not found');
    }
    const updateObj: {
      active: boolean;
      modifiedBy: number;
      modifiedIp: string;
      deactivationReason?: string;
    } = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    if (deactivationReason !== null && deactivationReason !== undefined) {
      updateObj.deactivationReason = deactivationReason;
    }
    await this.adminUserRepository.update(updateObj, { where: { adminId: id } });
  }

  public async getRoleDropdown(): Promise<IDropdownItem[]> {
    const roles = await this.adminRoleRepository.findAll({
      attributes: ['roleId', 'role', 'roleCode'],
      order: [['role', 'ASC']],
      raw: true,
    });
    return roles.map((r: { roleId: number; role: string; roleCode: string }) => ({
      id: r.roleId,
      label: `${r.role} (${r.roleCode})`,
    }));
  }

  public async getNutritionistDropdown(): Promise<IDropdownItem[]> {
    const nutritionists = await this.adminUserRepository.findAll({
      where: { active: true },
      order: [
        ['firstName', 'ASC'],
        ['lastName', 'ASC'],
      ],
      attributes: ['adminId', 'firstName', 'lastName'],
      raw: true,
      nest: true,
    });
    return nutritionists.map((n: any) => ({
      id: n.adminId,
      label: `${n.firstName} ${n.lastName}`.trim(),
      selected: false,
    }));
  }
}
