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
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import moment from 'moment';
import { MstReferrer } from '../../core/database/models/mst-referrer.model';
import { IReferrer } from 'shared-lib';
import { CreateReferrerDto } from './dto/referrer.dto';
import { Sequelize } from 'sequelize-typescript';
import { CommonService } from '../common/common.service';
import { TableEnum } from 'shared-lib';
import { AddressTypeEnum } from 'shared-lib';
import { IDropdownItem } from 'shared-lib';
import { SearchUtil } from 'src/util/search-util';
import { Transaction } from 'sequelize';

@Injectable()
export class ReferrerService {
  constructor(
    @InjectModel(MstReferrer) private readonly referrerRepository: typeof MstReferrer,
    private sequelize: Sequelize,
    private commonService: CommonService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IReferrer>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'name');
    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.referrerRepository.findAndCountAll<MstReferrer>({
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
      order: [['name', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IReferrer[] = [];
    for (const s of rows) {
      const iEvent: IReferrer = {
        id: s.referrerId,
        name: s.name,
        companyName: s.companyName,
        websiteLink: s.websiteLink,
        franchiseId: s.franchiseId,
        contactNumber: s.contactNumber,
        alternateContactNumber: s.alternateContactNumber,
        emailId: s.emailId,
        alternateEmailId: s.alternateEmailId,
        panNumber: s.panNumber,
        tanNumber: s.tanNumber,
        gstNumber: s.gstNumber,
        startDate: s.startDate ? moment(s.startDate, DB_DATE_FORMAT).toDate() : null,
        endDate: s.endDate ? moment(s.endDate, DB_DATE_FORMAT).toDate() : null,
        active: s.active,
        imagePath: CommonFunctionsUtil.getImagesObj(s.logo),
        createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      };
      resList.push(iEvent);
    }
    return <ITableList<IReferrer>>{
      tableData: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IReferrer> {
    const find = await this.referrerRepository.findOne({
      where: {
        referrerId: id,
      },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const dataObj = <IReferrer>{
      id: find.referrerId,
      name: find.name,
      companyName: find.companyName,
      websiteLink: find.websiteLink,
      franchiseId: find.franchiseId,
      contactNumber: find.contactNumber,
      alternateContactNumber: find.alternateContactNumber,
      emailId: find.emailId,
      alternateEmailId: find.alternateEmailId,
      panNumber: find.panNumber,
      tanNumber: find.tanNumber,
      gstNumber: find.gstNumber,
      startDate: find.startDate ? moment(find.startDate, DB_DATE_FORMAT).toDate() : null,
      endDate: find.endDate ? moment(find.endDate, DB_DATE_FORMAT).toDate() : null,
      active: find.active,
      imagePath: CommonFunctionsUtil.getImagesObj(find.logo),
      createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    };
    dataObj.addressObj = await this.commonService.findAddress(TableEnum.TXN_REFERRER, id);
    return dataObj;
  }

  public async create(obj: CreateReferrerDto, cIp: string, adminId: number): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const createObj = {
        name: obj.name,
        companyName: obj.companyName,
        websiteLink: obj.websiteLink,
        franchiseId: obj.franchiseId,
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
      const createdObj = await this.createInDB(createObj, t);
      // create address
      await this.commonService.addAddress({
        tableId: TableEnum.TXN_REFERRER,
        pkOfTable: createdObj['referrerId'],
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

  public async update(id: number, obj: CreateReferrerDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.referrerRepository.findOne({
      where: {
        referrerId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const t = await this.sequelize.transaction();
    try {
      const updateObj = {
        name: obj.name,
        companyName: obj.companyName,
        websiteLink: obj.websiteLink,
        franchiseId: obj.franchiseId,
        contactNumber: obj.contactNumber,
        alternateContactNumber: obj.alternateContactNumber,
        emailId: obj.emailId,
        alternateEmailId: obj.alternateEmailId,
        panNumber: obj.panNumber,
        tanNumber: obj.tanNumber,
        gstNumber: obj.gstNumber,
        startDate: obj.startDate ? moment(obj.startDate) : null,
        endDate: obj.endDate ? moment(obj.endDate) : null,
        logo: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
        active: obj.active != null ? obj.active : find.active,
        modifiedBy: adminId,
        modifiedIp: cIp,
      };
      await this.updateInDB(id, updateObj);
      // update address
      await this.commonService.updateAddressByTableNPkOfTable(TableEnum.TXN_REFERRER, id, {
        tableId: TableEnum.TXN_REFERRER,
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
    const find = await this.referrerRepository.findOne({
      where: {
        referrerId: id,
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

  public async fetchFranchiseBasedReferrer(franchiseId): Promise<IDropdownItem[]> {
    const rows = await this.referrerRepository.findAll<MstReferrer>({
      order: [['companyName', 'ASC']],
      where: {
        franchiseId: franchiseId,
      },
      raw: true,
      nest: true,
    });
    const resList: IDropdownItem[] = [];
    for (const s of rows) {
      const iEvent: IDropdownItem = {
        id: s.referrerId,
        label: `${s.name} (${s.companyName})`,
        selected: false,
      };
      resList.push(iEvent);
    }
    return resList;
  }

  private async createInDB(obj: any, transaction: Transaction) {
    return await this.referrerRepository.create(obj, { transaction: transaction });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.referrerRepository.update(obj, { where: { referrerId: id } });
  }
}
