import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstReferrer } from '../models';
import { ITableList, IBasicSearch, IReferrer, IManageReferrer } from 'eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil } from '@server/common';

@Injectable()
export class ReferrerService {
  constructor(
    @InjectModel(MstReferrer) private readonly referrerRepository: typeof MstReferrer,
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
      raw: true,
      nest: true,
    });

    const resList: IReferrer[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      data: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IReferrer {
    return <IReferrer>{
      referrerId: item.referrerId,
      id: item.referrerId,
      name: item.name,
      companyName: item.companyName,
      websiteLink: item.websiteLink,
      logo: CommonFunctionsUtil.getImagesObj(item.logo),
      franchiseId: item.franchiseId,
      franchise: item.franchise || '',
      emailId: item.emailId,
      alternateEmailId: item.alternateEmailId,
      contactNumber: item.contactNumber,
      alternateContactNumber: item.alternateContactNumber,
      postalAddress: item.postalAddress,
      stateId: item.stateId,
      state: item.state || '',
      countryId: item.countryId,
      country: item.country || '',
      pinCode: item.pinCode,
      panNumber: item.panNumber,
      tanNumber: item.tanNumber,
      gstNumber: item.gstNumber,
      startDate: item.startDate,
      endDate: item.endDate,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
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
    return this.convertToModel(find);
  }

  public async create(obj: IManageReferrer, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      name: obj.name,
      companyName: obj.companyName || null,
      websiteLink: obj.websiteLink || null,
      logo: (obj.logo && obj.logo.length > 0) ? JSON.stringify(obj.logo) : null,
      franchiseId: obj.franchiseId,
      emailId: obj.emailId,
      alternateEmailId: obj.alternateEmailId,
      contactNumber: obj.contactNumber,
      alternateContactNumber: obj.alternateContactNumber,
      postalAddress: obj.postalAddress,
      stateId: obj.stateId || null,
      countryId: obj.countryId || null,
      pinCode: obj.pinCode || null,
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
    await this.referrerRepository.create(createObj);
  }

  public async update(id: number, obj: IManageReferrer, cIp: string, adminId: number): Promise<void> {
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
      logo: (obj.logo && obj.logo.length > 0) ? JSON.stringify(obj.logo) : null,
      franchiseId: obj.franchiseId,
      emailId: obj.emailId,
      alternateEmailId: obj.alternateEmailId,
      contactNumber: obj.contactNumber,
      alternateContactNumber: obj.alternateContactNumber,
      postalAddress: obj.postalAddress,
      stateId: obj.stateId || null,
      countryId: obj.countryId || null,
      pinCode: obj.pinCode || null,
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
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
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
}

