import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from '../../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch } from 'shared-lib';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import moment from 'moment';
import { CreateCountryDto } from '../dto/country.dto';
import { MstCurrencyConfig } from '../../../core/database/models/mst-currency-config.model';
import { ICurrencyConfig, ICurrencyConfigList } from 'shared-lib';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectModel(MstCurrencyConfig) private readonly currencyRepository: typeof MstCurrencyConfig,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ICurrencyConfig>> {
    const whereCondition: any = {};
    if (searchDto.name) {
      whereCondition['country'] = searchDto.name;
    }
    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.currencyRepository.findAndCountAll<MstCurrencyConfig>({
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

    const resList: ICurrencyConfig[] = [];
    for (const s of rows) {
      resList.push(this.convertDBToInterface(s));
    }

    return <ITableList<ICurrencyConfig>>{
      data: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<ICurrencyConfig> {
    const find = await this.currencyRepository.findOne({
      where: {
        currencyConfigId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return this.convertDBToInterface(find);
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
    const find = await this.currencyRepository.findOne({
      where: {
        currencyConfigId: id,
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
    const find = await this.currencyRepository.findOne({
      where: {
        currencyConfigId: id,
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

  public async getCurrencyConfigList(): Promise<ICurrencyConfigList[]> {
    const tempList = await this.currencyRepository.findAll<MstCurrencyConfig>({
      where: {
        active: true,
      },
    });
    const list: ICurrencyConfigList[] = [];
    for (const dbObj of tempList) {
      list.push({
        sourceCurrencyCode: dbObj.sourceCurrencyCode,
        targetCurrencyCode: dbObj.targetCurrencyCode,
        conversionRate: dbObj.conversionRate,
        conversionRateFeesInPercent: dbObj.conversionRateFeesInPercent,
      });
    }
    return list;
  }

  private async createInDB(obj: any) {
    return await this.currencyRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.currencyRepository.update(obj, { where: { currencyConfigId: id } });
  }

  private convertDBToInterface(dbObj): ICurrencyConfig {
    const temp = <ICurrencyConfig>{
      id: dbObj.currencyConfigId,
      sourceCurrencyCode: dbObj.sourceCurrencyCode,
      targetCurrencyCode: dbObj.targetCurrencyCode,
      conversionRate: dbObj.conversionRate,
      conversionRateFeesInPercent: dbObj.conversionRateFeesInPercent,
      active: dbObj.active,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(dbObj['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(dbObj['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(dbObj.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(dbObj.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    };
    return temp;
  }
}
