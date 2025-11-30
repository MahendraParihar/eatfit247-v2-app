import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from '../../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch } from 'shared-lib';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import moment from 'moment';
import { MstCountries } from '../../../core/database/models/mst-countries.model';
import { ICountry } from 'shared-lib';
import { CreateCountryDto } from '../dto/country.dto';
import { IDropdownItem } from 'shared-lib';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class CountryService {
  constructor(
    @InjectModel(MstCountries) private readonly countryRepository: typeof MstCountries,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ICountry>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'country');

    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.countryRepository.findAndCountAll<MstCountries>({
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
      order: [['country', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: ICountry[] = [];
    for (const s of rows) {
      const iEvent: ICountry = {
        id: s.countryId,
        name: s.country,
        countryCode: s.countryCode,
        phoneNumberCode: s.phoneNumberCode,
        active: s.active,
        createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      };
      resList.push(iEvent);
    }

    return <ITableList<ICountry>>{
      data: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<ICountry> {
    const find = await this.countryRepository.findOne({
      where: {
        countryId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return <ICountry>{
      id: find.countryId,
      name: find.country,
      countryCode: find.countryCode,
      phoneNumberCode: find.phoneNumberCode,
      active: find.active,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    };
  }

  public async create(obj: CreateCountryDto, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      country: obj.name,
      countryCode: obj.countryCode,
      phoneNumberCode: obj.phoneNumberCode,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.createInDB(createObj);
  }

  public async update(id: number, obj: CreateCountryDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.countryRepository.findOne({
      where: {
        countryId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      country: obj.name,
      countryCode: obj.countryCode,
      phoneNumberCode: obj.phoneNumberCode,
      active: obj.active != null ? obj.active : find.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.countryRepository.findOne({
      where: {
        countryId: id,
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

  public async getCountryList(): Promise<IDropdownItem[]> {
    const tempList = await this.countryRepository.findAll<MstCountries>({
      where: {
        active: true,
      },
    });
    const list: IDropdownItem[] = [];
    for (const t of tempList) {
      list.push({
        id: t.countryId,
        label: t.country,
        selected: false,
      });
    }
    return list;
  }

  private async createInDB(obj: any) {
    return await this.countryRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.countryRepository.update(obj, { where: { countryId: id } });
  }
}
