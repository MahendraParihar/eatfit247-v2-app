import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BasicSearchDto, UpdateActiveDto } from '../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../core/database/models/mst-admin-user.model';
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  DB_DATE_FORMAT,
  DEFAULT_DATE_TIME_FORMAT,
} from '../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch } from 'shared-lib';
import moment from 'moment';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import { MstFranchise } from '../../core/database/models/mst-franchise.model';
import { IFranchise } from 'shared-lib';
import { CreateFranchiseDto } from './dto/franchise.dto';
import { IDropdownItem } from 'shared-lib';
import { TableEnum } from 'shared-lib';
import { CommonService } from '../common/common.service';
import { AddressTypeEnum } from 'shared-lib';
import { Sequelize } from 'sequelize-typescript';
import { AdminUserService } from '../admin-user/admin-user.service';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class FranchiseService {
  constructor(
    @InjectModel(MstFranchise) private readonly franchiseRepository: typeof MstFranchise,
    private sequelize: Sequelize,
    private commonService: CommonService,
    private adminUserService: AdminUserService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IFranchise>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'companyName');
    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.franchiseRepository.findAndCountAll<MstFranchise>({
      include: [
        {
          model: MstAdminUser,
          required: false,
          as: 'CreatedBy',
          attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
        },
        {
          model: MstAdminUser,
          required: false,
          as: 'ModifiedBy',
          attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
        },
      ],
      where: whereCondition,
      order: [['companyName', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IFranchise[] = [];
    for (const s of rows) {
      const iEvent: IFranchise = {
        id: s.franchiseId,
        firstName: s.firstName,
        lastName: s.lastName,
        companyName: s.companyName,
        contactNumber: s.contactNumber,
        alternateContactNumber: s.alternateContactNumber,
        emailId: s.emailId,
        alternateEmailId: s.alternateEmailId,
        panNumber: s.panNumber,
        tanNumber: s.tanNumber,
        gstNumber: s.gstNumber,
        startDate: s.startDate ? moment(s.startDate).format(DB_DATE_FORMAT) : null,
        endDate: s.endDate ? moment(s.endDate).format(DB_DATE_FORMAT) : null,
        active: s.active,
        imagePath: CommonFunctionsUtil.getImagesObj(s.logo),
        createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
        addressObj: await this.commonService.findAddress(TableEnum.MST_FRANCHISE, s.franchiseId),
      };
      resList.push(iEvent);
    }
    return <ITableList<IFranchise>>{
      data: resList,
      count: count,
    };
  }

  public async findRoleBasedFranchise(adminId: number): Promise<IDropdownItem[]> {
    return await this.fetchRoleBasedFranchise(adminId);
  }

  public async fetchRoleBasedFranchise(adminId): Promise<IDropdownItem[]> {
    const adminRole = await this.adminUserService.getAdminRole(adminId);
    const rows = await this.franchiseRepository.findAll<MstFranchise>({
      order: [['companyName', 'ASC']],
      raw: true,
      nest: true,
    });
    const resList: IDropdownItem[] = [];
    for (const s of rows) {
      const iEvent: IDropdownItem = {
        id: s.franchiseId,
        label: `${s.firstName} ${s.lastName} (${s.companyName})`,
        selected: false,
      };
      resList.push(iEvent);
    }
    return resList;
  }

  public async fetchById(id: number): Promise<IFranchise> {
    const find: MstFranchise = await this.franchiseRepository.findOne({
      where: {
        franchiseId: id,
      },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return await this.getFranchise(find);
  }

  public async fetchPrimaryFranchise(): Promise<IFranchise> {
    const find: MstFranchise = await this.franchiseRepository.findOne({
      where: {
        isPrimary: true,
      },
      raw: true,
      nest: true,
    });
    return this.getFranchise(find);
  }

  public async create(obj: CreateFranchiseDto, cIp: string, adminId: number): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const createObj = {
        firstName: obj.firstName,
        lastName: obj.lastName,
        companyName: obj.companyName,
        contactNumber: obj.contactNumber,
        alternateContactNumber: obj.alternateContactNumber,
        emailId: obj.emailId,
        alternateEmailId: obj.alternateEmailId,
        panNumber: obj.panNumber,
        tanNumber: obj.tanNumber,
        gstNumber: obj.gstNumber,
        startDate: moment(obj.startDate),
        endDate: obj.endDate ? moment(obj.endDate) : null,
        logo: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      };
      const createdObj = await this.createInDB(createObj);
      // create address
      await this.commonService.addAddress({
        tableId: TableEnum.MST_FRANCHISE,
        pkOfTable: createdObj['franchiseId'],
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
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async update(id: number, obj: CreateFranchiseDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.franchiseRepository.findOne({
      where: {
        franchiseId: id,
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
        companyName: obj.companyName,
        contactNumber: obj.contactNumber,
        alternateContactNumber: obj.alternateContactNumber,
        emailId: obj.emailId,
        alternateEmailId: obj.alternateEmailId,
        panNumber: obj.panNumber,
        tanNumber: obj.tanNumber,
        gstNumber: obj.gstNumber,
        startDate: moment(obj.startDate),
        endDate: obj.endDate ? moment(obj.endDate) : null,
        logo: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
        active: obj.active != null ? obj.active : find.active,
        modifiedBy: adminId,
        modifiedIp: cIp,
      };
      await this.updateInDB(id, updateObj);
      // update address
      await this.commonService.updateAddressByTableNPkOfTable(TableEnum.MST_FRANCHISE, id, {
        tableId: TableEnum.MST_FRANCHISE,
        pkOfTable: id,
        addressTypeId: obj.address.addressTypeId ? obj.address.addressTypeId : AddressTypeEnum.COMMUNICATION_ADDRESS,
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
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.franchiseRepository.findOne({
      where: {
        franchiseId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  private async getFranchise(find: MstFranchise) {
    let dataObj = null;
    if (find) {
      dataObj = <IFranchise>{
        id: find.franchiseId,
        firstName: find.firstName,
        lastName: find.lastName,
        companyName: find.companyName,
        contactNumber: find.contactNumber,
        alternateContactNumber: find.alternateContactNumber,
        emailId: find.emailId,
        alternateEmailId: find.alternateEmailId,
        panNumber: find.panNumber,
        tanNumber: find.tanNumber,
        gstNumber: find.gstNumber,
        startDate: find.startDate ? moment(find.startDate).format(DB_DATE_FORMAT) : null,
        endDate: find.endDate ? moment(find.endDate).format(DB_DATE_FORMAT) : null,
        active: find.active,
        imagePath: CommonFunctionsUtil.getImagesObj(find.logo),
        createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
        addressObj: await this.commonService.findAddress(TableEnum.MST_FRANCHISE, find.franchiseId),
      };
    }
    return dataObj;
  }

  private async createInDB(obj: any) {
    return await this.franchiseRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.franchiseRepository.update(obj, { where: { franchiseId: id } });
  }
}
