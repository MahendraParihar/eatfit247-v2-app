import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstAdminUser } from '../models';
import { ITableList, IBasicSearch, IAdminUser, IManageAdminUser, ConfigParam } from 'eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, CryptoUtil, generateRandomPassword, AppConfigService } from '@server/common';
import { Op } from 'sequelize';
import { MstAdminRolePermission } from '../models/mst-admin-role-permission.model';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectModel(MstAdminUser) private readonly adminUserRepository: typeof MstAdminUser,
    @InjectModel(MstAdminRolePermission) private readonly rolePermissionRepository: typeof MstAdminRolePermission,
    private appConfigService: AppConfigService,
  ) {}

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
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IAdminUser[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IAdminUser {
    return <IAdminUser>{
      adminId: item.adminId,
      id: item.adminId,
      firstName: item.firstName,
      lastName: item.lastName,
      profilePicture: CommonFunctionsUtil.buildImageUrl(item.profilePicture, this.appConfigService.getString(ConfigParam.CLIENT_URL)),
      countryCode: item.countryCode,
      contactNumber: item.contactNumber,
      emailId: item.emailId,
      addressId: item.addressId,
      startDate: item.startDate,
      endDate: item.endDate,
      franchiseId: item.franchiseId,
      franchise: item.franchise?.companyName || '',
      adminUserStatusId: item.adminUserStatusId,
      deactivationReason: item.deactivationReason,
      verificationCode: item.verificationCode,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
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
    return this.convertToModel(find);
  }

  public async create(obj: IManageAdminUser, cIp: string, adminId: number): Promise<void> {
    // Check if email already exists
    const existingUser = await this.adminUserRepository.findOne({
      where: { emailId: obj.emailId },
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Check if contact number already exists
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

    const createObj = {
      firstName: obj.firstName,
      lastName: obj.lastName,
      profilePicture: (obj.profilePicture && obj.profilePicture.length > 0) ? JSON.stringify(obj.profilePicture) : null,
      password: hashedPassword,
      passwordTemp: hashedPassword,
      countryCode: obj.countryCode,
      contactNumber: obj.contactNumber,
      emailId: obj.emailId,
      addressId: obj.addressId || null,
      startDate: obj.startDate,
      endDate: obj.endDate || null,
      franchiseId: obj.franchiseId || null,
      adminUserStatusId: obj.adminUserStatusId,
      deactivationReason: obj.deactivationReason || null,
      verificationCode: obj.verificationCode || null,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    
    const newAdminUser = await this.adminUserRepository.create(createObj);

    // Create role permissions if provided
    if (obj.roleIds && obj.roleIds.length > 0) {
      const rolePermissions = obj.roleIds.map(roleId => ({
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

  public async update(id: number, obj: IManageAdminUser, cIp: string, adminId: number): Promise<void> {
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

    const updateObj: any = {
      firstName: obj.firstName,
      lastName: obj.lastName,
      countryCode: obj.countryCode,
      contactNumber: obj.contactNumber,
      emailId: obj.emailId,
      addressId: obj.addressId || null,
      startDate: obj.startDate,
      endDate: obj.endDate || null,
      franchiseId: obj.franchiseId || null,
      adminUserStatusId: obj.adminUserStatusId,
      deactivationReason: obj.deactivationReason || null,
      verificationCode: obj.verificationCode || null,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };

    // Update password if provided
    if (obj.password) {
      const hashedPassword = await CryptoUtil.generateHash(obj.password);
      updateObj.password = hashedPassword;
      updateObj.passwordTemp = hashedPassword;
    }

    // Update profile picture if provided
    if (obj.profilePicture && obj.profilePicture.length > 0) {
      updateObj.profilePicture = JSON.stringify(obj.profilePicture);
    }

    await this.adminUserRepository.update(updateObj, { where: { adminId: id } });

    // Update role permissions if provided
    if (obj.roleIds !== undefined) {
      // Delete existing role permissions
      await this.rolePermissionRepository.destroy({ where: { adminId: id } });
      
      // Create new role permissions
      if (obj.roleIds.length > 0) {
        const rolePermissions = obj.roleIds.map(roleId => ({
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

  public async changeStatus(id: number, adminUserStatusId: number, deactivationReason: string | null, cIp: string, adminId: number): Promise<void> {
    const find = await this.adminUserRepository.findOne({ where: { adminId: id } });
    if (!find) {
      throw new NotFoundException('Admin user not found');
    }
    const updateObj: any = {
      adminUserStatusId: adminUserStatusId,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    if (deactivationReason !== null && deactivationReason !== undefined) {
      updateObj.deactivationReason = deactivationReason;
    }
    await this.adminUserRepository.update(updateObj, { where: { adminId: id } });
  }
}

