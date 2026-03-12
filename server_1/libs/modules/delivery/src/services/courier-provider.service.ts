import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstCourierProvider } from '../models';
import {
  IBasicSearch,
  ICourierProvider,
  IDropdownItem,
  IManageCourierProvider,
  ITableList,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class CourierProviderService {
  constructor(
    @InjectModel(MstCourierProvider)
    private readonly courierProviderRepository: typeof MstCourierProvider,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ICourierProvider>> {
    const whereCondition: Record<string, unknown> = SearchUtil.filterBasicSearch(
      searchDto,
      'providerName',
    );
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.courierProviderRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [
        ['priorityOrder', 'ASC'],
        ['providerName', 'ASC'],
      ],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: ICourierProvider[] = rows.map((item: MstCourierProvider) =>
      this.convertToModel(item),
    );
    return { tableData: resList, count: count };
  }

  private convertToModel(item: MstCourierProvider): ICourierProvider {
    return <ICourierProvider>{
      courierProviderId: item.courierProviderId,
      providerCode: item.providerCode,
      providerName: item.providerName,
      authType: item.authType,
      supportsRateApi: item.supportsRateApi,
      supportsWebhook: item.supportsWebhook,
      priorityOrder: item.priorityOrder,
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

  public async fetchById(id: number): Promise<ICourierProvider> {
    const find = await this.courierProviderRepository.scope('details').findOne({
      where: { courierProviderId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Courier provider not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageCourierProvider, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      providerCode: obj.providerCode,
      providerName: obj.providerName,
      authType: obj.authType,
      supportsRateApi: obj.supportsRateApi,
      supportsWebhook: obj.supportsWebhook,
      priorityOrder: obj.priorityOrder,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.courierProviderRepository.create(createObj);
  }

  public async update(
    id: number,
    obj: IManageCourierProvider,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.courierProviderRepository.findOne({ where: { courierProviderId: id } });
    if (!find) {
      throw new NotFoundException('Courier provider not found');
    }
    const updateObj = {
      providerCode: obj.providerCode,
      providerName: obj.providerName,
      authType: obj.authType,
      supportsRateApi: obj.supportsRateApi,
      supportsWebhook: obj.supportsWebhook,
      priorityOrder: obj.priorityOrder,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.courierProviderRepository.update(updateObj, { where: { courierProviderId: id } });
  }

  public async changeStatus(
    id: number,
    active: boolean,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.courierProviderRepository.findOne({ where: { courierProviderId: id } });
    if (!find) {
      throw new NotFoundException('Courier provider not found');
    }
    await this.courierProviderRepository.update(
      { active, modifiedBy: adminId, modifiedIp: cIp },
      { where: { courierProviderId: id } },
    );
  }

  public async getCourierProviderList(): Promise<IDropdownItem[]> {
    const tempList = await this.courierProviderRepository.findAll<MstCourierProvider>({
      where: { active: true },
      order: [
        ['priorityOrder', 'ASC'],
        ['providerName', 'ASC'],
      ],
    });
    return tempList.map((t) => ({
      id: t.courierProviderId,
      label: t.providerName,
      selected: false,
    }));
  }
}
