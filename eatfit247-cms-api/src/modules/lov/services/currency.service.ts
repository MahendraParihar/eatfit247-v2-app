import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../../common/exception.service';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { IServerResponse } from '../../../common-dto/response-interface';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT, IS_DEV } from '../../../constants/config-constants';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import * as moment from 'moment';
import { CreateCountryDto } from '../dto/country.dto';
import { MstCurrencyConfig } from '../../../core/database/models/mst-currency-config.model';
import { ICurrencyConfig, ICurrencyConfigList } from '../../../response-interface/currency.interface';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectModel(MstCurrencyConfig) private readonly currencyRepository: typeof MstCurrencyConfig,
    private exceptionService: ExceptionService,
  ) {}

  public async findAll(searchDto: BasicSearchDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const whereCondition: any = {};
      if (searchDto.name) {
        whereCondition['country'] = searchDto.name;
      }
      const pageNumber = searchDto.pageNumber;
      const pageSize = searchDto.pageSize;
      let offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

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
      if (!rows || rows.length === 0) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
        return res;
      }

      const resList: ICurrencyConfig[] = [];
      for (const s of rows) {
        resList.push(this.convertDBToInterface(s));
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
      this.exceptionService.logError(e);
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
      const find = await this.currencyRepository.findOne({
        where: {
          currencyConfigId: id,
        },
      });
      if (find) {
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS,
          data: this.convertDBToInterface(find),
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
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async create(obj: CreateCountryDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const createObj = {
        country: obj.name,
        countryCode: obj.countryCode,
        phoneNumberCode: obj.phoneNumberCode,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      };
      const createdObj = await this.createInDB(createObj);
      if (createdObj) {
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS_DATA_UPDATE,
          data: null,
        };
      } else {
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.SOMETHING_WENT_WRONG,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async update(id: number, obj: CreateCountryDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.currencyRepository.findOne({
        where: {
          currencyConfigId: id,
        },
      });
      if (find) {
        const updateObj = {
          country: obj.name,
          countryCode: obj.countryCode,
          phoneNumberCode: obj.phoneNumberCode,
          active: obj.active != null ? obj.active : find.active,
          modifiedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObj = await this.updateInDB(id, updateObj);
        if (updatedObj) {
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_UPDATE,
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
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.currencyRepository.findOne({
        where: {
          currencyConfigId: id,
        },
      });
      if (find) {
        const updateObj = {
          active: obj.active,
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
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
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
    return await this.currencyRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.currencyRepository
      .update(obj, { where: { currencyConfigId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
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
