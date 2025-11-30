import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstCountry } from '../models';
import { ITableList, IBasicSearch, ICountry, IManageCountry, IDropdownItem } from 'eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil } from '@server/common';

@Injectable()
export class CountryService {
  constructor(
    @InjectModel(MstCountry) private readonly countryRepository: typeof MstCountry,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ICountry>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'country');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.countryRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['country', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: ICountry[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { data: resList, count: count };
  }

  private convertToModel(item: any): ICountry {
    return <ICountry>{
      countryId: item.countryId,
      id: item.countryId,
      country: item.country,
      countryCode: item.countryCode,
      phoneNumberCode: item.phoneNumberCode,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<ICountry> {
    const find = await this.countryRepository.scope('details').findOne({
      where: { countryId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Country not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageCountry, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      country: obj.country,
      countryCode: obj.countryCode || null,
      phoneNumberCode: obj.phoneNumberCode || null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.countryRepository.create(createObj);
  }

  public async update(id: number, obj: IManageCountry, cIp: string, adminId: number): Promise<void> {
    const find = await this.countryRepository.findOne({ where: { countryId: id } });
    if (!find) {
      throw new NotFoundException('Country not found');
    }
    const updateObj = {
      country: obj.country,
      countryCode: obj.countryCode || null,
      phoneNumberCode: obj.phoneNumberCode || null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.countryRepository.update(updateObj, { where: { countryId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.countryRepository.findOne({ where: { countryId: id } });
    if (!find) {
      throw new NotFoundException('Country not found');
    }
    await this.countryRepository.update({ active, modifiedBy: adminId, modifiedIp: cIp }, { where: { countryId: id } });
  }

  public async getCountryList(): Promise<IDropdownItem[]> {
    const tempList = await this.countryRepository.findAll<MstCountry>({
      where: { active: true },
      order: [['country', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.countryId, label: t.country, selected: false }));
  }
}

