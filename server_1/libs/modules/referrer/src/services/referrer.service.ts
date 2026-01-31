import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstReferrer } from '../models';
import {
  IBasicSearch,
  IDropdownItem,
  IManageAddress,
  IManageReferrer,
  IPublicReferrer,
  IReferrer,
  ITableList,
  TableEnum,
} from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil } from '@server_1/core';
import { AddressService } from '@server_1/platform';

@Injectable()
export class ReferrerService {
  constructor(
    @InjectModel(MstReferrer) private readonly referrerRepository: typeof MstReferrer,
    private addressService: AddressService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IReferrer>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'name');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.referrerRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['name', 'ASC']],
      offset: offset,
      limit: pageSize,
      nest: true,
    });
    const resList: IReferrer[] = rows.map((item: MstReferrer) => {
      return this.convertToModel(item);
    });
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: MstReferrer): IReferrer {
    console.log(item);
    return <IReferrer>{
      referrerId: item.referrerId,
      id: item.referrerId,
      name: item.name,
      companyName: item.companyName,
      websiteLink: item.websiteLink,
      logo: CommonFunctionsUtil.buildImageUrl(item.logo),
      franchiseId: item.franchiseId,
      emailId: item.emailId,
      alternateEmailId: item.alternateEmailId,
      contactNumber: item.contactNumber,
      alternateContactNumber: item.alternateContactNumber,
      panNumber: item.panNumber,
      tanNumber: item.tanNumber,
      gstNumber: item.gstNumber,
      startDate: item.startDate,
      endDate: item.endDate,
      active: item.active,
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
    };
  }

  public async fetchById(id: number): Promise<IReferrer> {
    const find = await this.referrerRepository.scope('details').findOne({
      where: { referrerId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Referrer not found');
    }
    const referrer = this.convertToModel(find);
    // Fetch address data
    const address = await this.addressService.findByTableIdAndPk(TableEnum.TXN_REFERRER, id);
    if (address) {
      referrer.address = address;
    }
    return referrer;
  }

  public async create(obj: IManageReferrer, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      name: obj.name,
      companyName: obj.companyName || null,
      websiteLink: obj.websiteLink || null,
      logo: obj.logo && obj.logo.length > 0 ? obj.logo : null,
      franchiseId: obj.franchiseId,
      emailId: obj.emailId,
      alternateEmailId: obj.alternateEmailId,
      contactNumber: obj.contactNumber,
      alternateContactNumber: obj.alternateContactNumber,
      panNumber: obj.panNumber || null,
      tanNumber: obj.tanNumber || null,
      gstNumber: obj.gstNumber || null,
      startDate: obj.startDate || null,
      endDate: obj.endDate || null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    const referrer = await this.referrerRepository.create(createObj);
    // Create an address if provided
    if (obj.address) {
      const addressData: IManageAddress = obj.address;
      addressData.tableId = addressData.tableId || TableEnum.TXN_REFERRER;
      addressData.pkOfTable = referrer.referrerId;
      await this.addressService.createOrUpdate(addressData as IManageAddress, cIp, adminId);
    }
  }

  public async update(
    id: number,
    obj: IManageReferrer,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.referrerRepository.findOne({
      where: { referrerId: id },
    });
    if (!find) {
      throw new NotFoundException('Referrer not found');
    }
    const updateObj = {
      name: obj.name,
      companyName: obj.companyName || null,
      websiteLink: obj.websiteLink || null,
      logo: obj.logo && obj.logo.length > 0 ? obj.logo : null,
      franchiseId: obj.franchiseId,
      emailId: obj.emailId,
      alternateEmailId: obj.alternateEmailId,
      contactNumber: obj.contactNumber,
      alternateContactNumber: obj.alternateContactNumber,
      panNumber: obj.panNumber || null,
      tanNumber: obj.tanNumber || null,
      gstNumber: obj.gstNumber || null,
      startDate: obj.startDate || null,
      endDate: obj.endDate || null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.referrerRepository.update(updateObj, { where: { referrerId: id } });
    // Update address if provided
    if (obj.address) {
      const addressData: IManageAddress = { ...obj.address };
      addressData.tableId = addressData.tableId || TableEnum.TXN_REFERRER;
      addressData.pkOfTable = id;
      await this.addressService.createOrUpdate(addressData as IManageAddress, cIp, adminId);
    }
  }

  public async changeStatus(
    id: number,
    active: boolean,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.referrerRepository.findOne({
      where: { referrerId: id },
    });
    if (!find) {
      throw new NotFoundException('Referrer not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.referrerRepository.update(updateObj, { where: { referrerId: id } });
  }

  public async getReferrerList(): Promise<IDropdownItem[]> {
    const tempList = await this.referrerRepository.scope('list').findAll({
      where: { active: true },
      order: [['name', 'ASC']],
      raw: true,
      nest: true,
    });
    return tempList.map((t: any) => ({
      id: t.referrerId,
      label: t.name,
      isActive: t.active,
    }));
  }

  /**
   * Public method to fetch active referrers with only company name and logo
   */
  public async findAllPublic(searchDto: IBasicSearch): Promise<ITableList<IPublicReferrer>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'companyName');
    // Only return active referrers
    whereCondition.active = true;

    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    // For public endpoints, don't use scope with includes to avoid issues with raw: true
    const { rows, count } = await this.referrerRepository.findAndCountAll({
      where: whereCondition,
      order: [['companyName', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
      attributes: ['companyName', 'logo'], // Only select companyName and logo using model property names
    });

    const resList = rows.map((item: any) => ({
      companyName: item.companyName || item.company_name || '',
      logo: CommonFunctionsUtil.buildImageUrl(item.logo),
    }));

    return {
      tableData: resList,
      count: count,
    };
  }
}

