import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../common/exception.service';
import { BasicSearchDto, UpdateUserStatusDto } from '../../common-dto/basic-input.dto';
import { IServerResponse } from '../../common-dto/response-interface';
import { MstAdminUser } from '../../core/database/models/mst-admin-user.model';
import { DB_DATE_FORMAT, DEFAULT_DATE_TIME_FORMAT, IS_DEV } from '../../constants/config-constants';
import { ServerResponseEnum } from '../../enums/server-response-enum';
import { StringResource } from '../../enums/string-resource';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import * as moment from 'moment';
import { ChangePasswordDto, CreateAdminUserDto } from './dto/admin-user.dto';
import { IAdminUserList } from '../../response-interface/admin-user-list.interface';
import { MstFranchise } from '../../core/database/models/mst-franchise.model';
import { TableEnum } from '../../enums/table-enum';
import { CommonService } from '../common/common.service';
import { MstAdminRolePermission } from '../../core/database/models/mst-admin-role-permission.model';
import { IRole } from '../../response-interface/role.interface';
import { MstAdminRole } from '../../core/database/models/mst-admin-role.model';
import { AddressTypeEnum } from '../../enums/address-type-enum';
import { Sequelize } from 'sequelize-typescript';
import { CryptoUtil } from '../../util/crypto-util';
import { UserStatusEnum } from '../../enums/user-status-enum';
import { DropdownListInterface } from '../../response-interface/dropdown-list.interface';
import { Op } from 'sequelize';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectModel(MstAdminUser)
    private readonly adminUserRepository: typeof MstAdminUser,
    @InjectModel(MstAdminRolePermission)
    private readonly adminRolePermissionRepository: typeof MstAdminRolePermission,
    private exceptionService: ExceptionService,
    private sequelize: Sequelize,
    private commonService: CommonService,
  ) {}

  public async findAll(searchDto: BasicSearchDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
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
      if (!rows || rows.length === 0) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
        return res;
      }

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
          deactivationReason: s.deactivationReason,
          startDate: s.startDate ? moment(s.startDate, DB_DATE_FORMAT) : null,
          endDate: s.endDate ? moment(s.endDate, DB_DATE_FORMAT) : null,
          createdBy: CommonFunctionsUtil.getAdminShortInfo(s['ACreatedBy'], 'CreatedBy'),
          updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['AModifiedBy'], 'ModifiedBy'),
          createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
          updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
          roleList: await this.getAdminRole(s.adminId),
        };
        resList.push(iEvent);
      }

      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: {
          list: resList,
          count: count,
        },
      };

      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async fetchById(id: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
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
      if (find) {
        const dataObj = <IAdminUserList>{
          adminId: find.adminId,
          firstName: find.firstName,
          lastName: find.lastName,
          imagePath: CommonFunctionsUtil.getImagesObj(find.profilePicture),
          emailId: find.emailId,
          franchiseId: find.franchiseId,
          countryCode: find.countryCode,
          contactNumber: find.contactNumber,
          adminUserStatusId: find.adminUserStatusId,
          deactivationReason: find.deactivationReason,
          startDate: find.startDate ? moment(find.startDate, DB_DATE_FORMAT) : null,
          endDate: find.endDate ? moment(find.endDate, DB_DATE_FORMAT) : null,
          createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
          updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
          createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
          updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
          addressObj: await this.commonService.findAddress(TableEnum.TXN_ADMIN, id),
          roleList: await this.getAdminRole(id),
        };

        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS,
          data: dataObj,
        };
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async create(obj: CreateAdminUserDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
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
        password: await CryptoUtil.hashPassword(`${CommonFunctionsUtil.removeSpecialChar(obj.firstName)}@123456`),
        deactivationReason: obj.reason ? obj.reason : null,
        startDate: obj.startDate ? moment(obj.startDate) : null,
        endDate: obj.endDate ? moment(obj.endDate) : null,
        profilePicture: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      };
      const createdObj = await this.createInDB(createObj);

      // create address
      const addObj = await this.commonService.addAddress({
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
      });

      await this.deleteNAddRole(createdObj['adminId'], obj.roleId, cIp, adminId);

      if (createdObj && addObj) {
        await t.commit();
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS_DATA_UPDATE,
          data: null,
        };
      } else {
        await t.rollback();
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.SOMETHING_WENT_WRONG,
          data: null,
        };
      }
      return res;
    } catch (e) {
      await t.rollback();
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async update(id: number, obj: CreateAdminUserDto, cIp: string, adminId: number): Promise<IServerResponse> {
    const t = await this.sequelize.transaction();
    let res: IServerResponse;
    try {
      const find = await this.adminUserRepository.findOne({
        where: {
          adminId: id,
        },
      });
      if (find) {
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
        await this.updateInDB(id, updateObj);

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
          });
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
          });
        }

        await this.deleteNAddRole(id, obj.roleId, cIp, adminId);

        await t.commit();
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS_DATA_UPDATE,
          data: null,
        };
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      await t.rollback();
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async changeStatus(
    id: number,
    obj: UpdateUserStatusDto,
    cIp: string,
    adminId: number,
  ): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.adminUserRepository.findOne({
        where: {
          adminId: id,
        },
      });
      if (find) {
        const updateObj = {
          adminUserStatusId: obj.statusId,
          deactivationReason: obj.reason,
          modifiedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObj = await this.updateInDB(id, updateObj);
        if (updatedObj) {
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_STATUS_CHANGE,
            data: null,
          };
        } else {
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null,
          };
        }
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async changePassword(
    id: number,
    cIp: string,
    adminId: number,
    body: ChangePasswordDto,
  ): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.adminUserRepository.findOne({
        where: {
          adminId: id,
        },
        raw: true,
      });
      if (find.adminUserStatusId === UserStatusEnum.IN_ACTIVE) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.INACTIVE_USER,
          data: null,
        };
        return res;
      }
      if (
        find.password !==
        (await CryptoUtil.hashPassword(`${CommonFunctionsUtil.removeSpecialChar(body.currentPassword)}`))
      ) {
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.CURRENT_PASSWORD,
          data: null,
        };
        return res;
      }
      if (find) {
        if (body.currentPassword !== body.repeatPassword) {
          return {
            code: ServerResponseEnum.ERROR,
            message: StringResource.REPEAT_PASSWORD_NOT_MATCH,
            data: null,
          };
        }
        const updateObj = {
          password: await CryptoUtil.hashPassword(`${CommonFunctionsUtil.removeSpecialChar(body.newPassword)}`),
          modifiedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObj = await this.updateInDB(id, updateObj);
        if (updatedObj) {
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_PASSWORD_CHANGE,
            data: null,
          };
        } else {
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null,
          };
        }
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async resetPassword(id: number, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.adminUserRepository.findOne({
        where: {
          adminId: id,
        },
        raw: true,
      });
      if (find.adminUserStatusId === UserStatusEnum.IN_ACTIVE) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.INACTIVE_USER,
          data: null,
        };
        return res;
      }
      if (find) {
        const updateObj = {
          password: CommonFunctionsUtil.generateRandomString(12),
          modifiedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObj = await this.updateInDB(id, updateObj);
        if (updatedObj) {
          // TODO SEND MAIL
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_PASSWORD_CHANGE,
            data: null,
          };
        } else {
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null,
          };
        }
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async getAdminRole(adminId): Promise<IRole[]> {
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

  public async fetchFranchiseBasedNutritionist(franchiseId): Promise<DropdownListInterface[]> {
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
    const resList: DropdownListInterface[] = [];
    for (const s of rows) {
      const iEvent: DropdownListInterface = {
        id: s.adminId,
        name: `${s.firstName} ${s.lastName}`,
        selected: false,
      };
      resList.push(iEvent);
    }
    return resList;
  }

  private async createInDB(obj: any) {
    return await this.adminUserRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.adminUserRepository
      .update(obj, { where: { adminId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async deleteNAddRole(id: number, roleId: number, cIp: string, adminId: number): Promise<void> {
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
    });
  }
}
