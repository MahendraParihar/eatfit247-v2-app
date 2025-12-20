import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UpdateUserStatusDto } from '../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../core/database/models/mst-admin-user.model';
import { DB_DATE_FORMAT, DEFAULT_DATE_TIME_FORMAT } from '../../constants/config-constants';
import {
  AddressTypeEnum,
  IAdminUserList,
  IBasicSearch,
  IDropdownItem,
  IRole,
  ITableList,
  StringResource,
  TableEnum,
  UserStatusEnum,
} from 'shared-lib';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import moment from 'moment';
import { ChangePasswordDto, CreateAdminUserDto } from './dto/admin-user.dto';
import { MstFranchise } from '../../core/database/models/mst-franchise.model';
import { CommonService } from '../common/common.service';
import { MstAdminRolePermission } from '../../core/database/models/mst-admin-role-permission.model';
import { MstAdminRole } from '../../core/database/models/mst-admin-role.model';
import { Sequelize } from 'sequelize-typescript';
import { CryptoUtil } from '../../util/crypto-util';
import { Op, Transaction } from 'sequelize';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectModel(MstAdminUser)
    private readonly adminUserRepository: typeof MstAdminUser,
    @InjectModel(MstAdminRolePermission)
    private readonly adminRolePermissionRepository: typeof MstAdminRolePermission,
    private sequelize: Sequelize,
    private commonService: CommonService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IAdminUserList>> {
    let whereCondition: any = {};
    if (searchDto.name) {
      whereCondition = {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${searchDto.name}%` } },
          { lastName: { [Op.iLike]: `%${searchDto.name}%` } },
        ],
      };
    }
    const dateFilter = SearchUtil.filterDateRange(searchDto.createdFrom, searchDto.createdTo);
    if (dateFilter) {
      whereCondition['createdAt'] = dateFilter;
    }
    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.adminUserRepository.findAndCountAll<MstAdminUser>({
      include: [
        {
          model: MstFranchise,
          required: false,
          as: 'AdminFranchise',
        },
      ],
      where: whereCondition,
      order: [
        ['franchiseId', 'ASC'],
        ['firstName', 'ASC'],
        ['lastName', 'ASC'],
      ],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IAdminUserList[] = [];
    for (const s of rows) {
      const iEvent: IAdminUserList = {
        adminId: s.adminId,
        firstName: s.firstName,
        lastName: s.lastName,
        imagePath: CommonFunctionsUtil.getImagesObj(s.profilePicture),
        emailId: s.emailId,
        countryCode: s.countryCode,
        contactNumber: s.contactNumber,
        franchiseId: s.franchiseId,
        adminUserStatusId: s.adminUserStatusId,
        reason: s.deactivationReason,
        startDate: s.startDate ? moment(s.startDate, DB_DATE_FORMAT).toDate() : null,
        endDate: s.endDate ? moment(s.endDate, DB_DATE_FORMAT).toDate() : null,
        createdBy: CommonFunctionsUtil.getAdminShortInfo(s['ACreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['AModifiedBy'], 'ModifiedBy'),
        createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
        roleList: await this.getAdminRole(s.adminId),
      };
      resList.push(iEvent);
    }
    return <ITableList<IAdminUserList>>{
      tableData: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IAdminUserList> {
    const find = await this.adminUserRepository.findOne({
      include: [
        {
          model: MstFranchise,
          required: false,
          as: 'AdminFranchise',
        },
      ],
      where: {
        adminId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return <IAdminUserList>{
      adminId: find.adminId,
      firstName: find.firstName,
      lastName: find.lastName,
      imagePath: CommonFunctionsUtil.getImagesObj(find.profilePicture),
      emailId: find.emailId,
      franchiseId: find.franchiseId,
      countryCode: find.countryCode,
      contactNumber: find.contactNumber,
      adminUserStatusId: find.adminUserStatusId,
      reason: find.deactivationReason,
      startDate: find.startDate ? moment(find.startDate, DB_DATE_FORMAT).toDate() : null,
      endDate: find.endDate ? moment(find.endDate, DB_DATE_FORMAT).toDate() : null,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      addressObj: await this.commonService.findAddress(TableEnum.TXN_ADMIN, id),
      roleList: await this.getAdminRole(id),
    };
  }

  public async create(obj: CreateAdminUserDto, cIp: string, adminId: number): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const createObj = {
        firstName: obj.firstName,
        lastName: obj.lastName,
        countryCode: obj.countryCode,
        contactNumber: obj.contactNumber,
        emailId: obj.emailId,
        franchiseId: obj.franchiseId ? obj.franchiseId : null,
        adminUserStatusId: obj.adminUserStatusId,
        password: await CryptoUtil.generateHash(`${CommonFunctionsUtil.removeSpecialChar(obj.firstName)}@123456`),
        deactivationReason: obj.reason ? obj.reason : null,
        startDate: obj.startDate ? moment(obj.startDate) : null,
        endDate: obj.endDate ? moment(obj.endDate) : null,
        profilePicture: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      };
      const createdObj = await this.createInDB(createObj, t);
      // create address
      await this.commonService.addAddress({
        tableId: TableEnum.TXN_ADMIN,
        pkOfTable: createdObj['adminId'],
        addressTypeId: obj.address.addressTypeId ? obj.address.addressTypeId : AddressTypeEnum.COMMUNICATION_ADDRESS,
        postalAddress: obj.address.postalAddress,
        pinCode: obj.address.pinCode,
        cityVillage: obj.address.cityVillage,
        stateId: obj.address.stateId,
        countryId: obj.address.countryId,
        latitude: obj.address.latitude,
        longitude: obj.address.longitude,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      }, t);
      await this.deleteNAddRole(createdObj['adminId'], obj.roleId, cIp, adminId, t);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async update(id: number, obj: CreateAdminUserDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.adminUserRepository.findOne({
      where: {
        adminId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const t = await this.sequelize.transaction();
    try {
      const updateObj = {
        firstName: obj.firstName,
        lastName: obj.lastName,
        countryCode: obj.countryCode,
        contactNumber: obj.contactNumber,
        emailId: obj.emailId,
        franchiseId: obj.franchiseId ? obj.franchiseId : null,
        adminUserStatusId: obj.adminUserStatusId,
        deactivationReason: obj.reason ? obj.reason : null,
        startDate: obj.startDate ? moment(obj.startDate) : null,
        endDate: obj.endDate ? moment(obj.endDate) : null,
        profilePicture: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
        modifiedBy: adminId,
        modifiedIp: cIp,
      };
      await this.updateInDB(id, updateObj, t);
      // update address
      const tempAdd = await this.commonService.findAddress(TableEnum.TXN_ADMIN, id);
      if (tempAdd) {
        await this.commonService.updateAddressByTableNPkOfTable(TableEnum.TXN_ADMIN, id, {
          tableId: TableEnum.TXN_ADMIN,
          pkOfTable: id,
          addressTypeId: obj.address.addressTypeId
            ? obj.address.addressTypeId
            : AddressTypeEnum.COMMUNICATION_ADDRESS,
          postalAddress: obj.address.postalAddress,
          pinCode: obj.address.pinCode,
          cityVillage: obj.address.cityVillage,
          stateId: obj.address.stateId,
          countryId: obj.address.countryId,
          latitude: obj.address.latitude,
          longitude: obj.address.longitude,
          modifiedBy: adminId,
          modifiedIp: cIp,
        }, t);
      } else {
        await this.commonService.addAddress({
          tableId: TableEnum.TXN_ADMIN,
          pkOfTable: id,
          addressTypeId: obj.address.addressTypeId
            ? obj.address.addressTypeId
            : AddressTypeEnum.COMMUNICATION_ADDRESS,
          postalAddress: obj.address.postalAddress,
          pinCode: obj.address.pinCode,
          cityVillage: obj.address.cityVillage,
          stateId: obj.address.stateId,
          countryId: obj.address.countryId,
          latitude: obj.address.latitude,
          longitude: obj.address.longitude,
          createdBy: adminId,
          modifiedBy: adminId,
          createdIp: cIp,
          modifiedIp: cIp,
        }, t);
      }
      await this.deleteNAddRole(id, obj.roleId, cIp, adminId, t);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async changeStatus(
    id: number,
    obj: UpdateUserStatusDto,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.adminUserRepository.findOne({
      where: {
        adminId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      adminUserStatusId: obj.statusId,
      deactivationReason: obj.reason,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.adminUserRepository.update(updateObj, { where: { adminId: id } });
  }

  public async changePassword(
    id: number,
    cIp: string,
    adminId: number,
    body: ChangePasswordDto,
  ): Promise<void> {
    const find = await this.adminUserRepository.findOne({
      where: {
        adminId: id,
      },
      raw: true,
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    if (find.adminUserStatusId === UserStatusEnum.IN_ACTIVE) {
      throw new BadRequestException(StringResource.INACTIVE_USER);
    }
    if (
      find.password !==
      (await CryptoUtil.generateHash(`${CommonFunctionsUtil.removeSpecialChar(body.password)}`))
    ) {
      throw new BadRequestException(StringResource.CURRENT_PASSWORD);
    }
    if (body.newPassword !== body.repeatPassword) {
      throw new BadRequestException(StringResource.REPEAT_PASSWORD_NOT_MATCH);
    }
    const updateObj = {
      password: await CryptoUtil.generateHash(`${CommonFunctionsUtil.removeSpecialChar(body.newPassword)}`),
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.adminUserRepository.update(updateObj, { where: { adminId: id } });
  }

  public async resetPassword(id: number, cIp: string, adminId: number): Promise<void> {
    const find = await this.adminUserRepository.findOne({
      where: {
        adminId: id,
      },
      raw: true,
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    if (find.adminUserStatusId === UserStatusEnum.IN_ACTIVE) {
      throw new BadRequestException(StringResource.INACTIVE_USER);
    }
    const updateObj = {
      password: CommonFunctionsUtil.generateRandomString(12),
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.adminUserRepository.update(updateObj, { where: { adminId: id } });
    // TODO SEND MAIL
  }

  public async getAdminRole(adminId: number): Promise<IRole[]> {
    const adminRole = await this.adminRolePermissionRepository.findAll({
      include: [
        {
          model: MstAdminRole,
          required: true,
          as: 'Role',
        },
      ],
      where: {
        adminId: adminId,
        active: true,
      },
      raw: true,
      nest: true,
    });
    const roleList: IRole[] = [];
    for (const s of adminRole) {
      roleList.push(<IRole>{
        role: s['Role']['role'],
        roleId: s.roleId,
        id: s.adminRolePermissionId,
      });
    }
    return roleList;
  }

  public async fetchFranchiseBasedNutritionist(franchiseId): Promise<IDropdownItem[]> {
    const rows = await this.adminUserRepository.findAll<MstAdminUser>({
      order: [
        ['firstName', 'ASC'],
        ['lastName', 'ASC'],
      ],
      where: {
        franchiseId: franchiseId,
        adminUserStatusId: UserStatusEnum.ACTIVE,
      },
      raw: true,
      nest: true,
    });
    const resList: IDropdownItem[] = [];
    for (const s of rows) {
      const iEvent: IDropdownItem = {
        id: s.adminId,
        label: `${s.firstName} ${s.lastName}`,
        selected: false,
      };
      resList.push(iEvent);
    }
    return resList;
  }

  private async createInDB(obj: any, t: Transaction) {
    return await this.adminUserRepository.create(obj, { transaction: t });
  }

  private async updateInDB(id: number, obj: any, t: Transaction) {
    return await this.adminUserRepository.update(obj, { where: { adminId: id }, transaction: t });
  }

  private async deleteNAddRole(id: number, roleId: number, cIp: string, adminId: number, t: Transaction): Promise<void> {
    await this.adminRolePermissionRepository.destroy({
      where: {
        adminId: id,
      },
    });
    await this.adminRolePermissionRepository.create({
      adminId: id,
      roleId: roleId,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    }, { transaction: t });
  }
}
