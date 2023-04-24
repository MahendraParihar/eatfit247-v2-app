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
import { MstHealthParameter } from '../../../core/database/models/mst-health-parameter.model';
import { CreateHealthParameterDto } from '../dto/health-parameter.dto';
import { IHealthParameter, IHealthParameterUnitMapping } from '../../../response-interface/health-parameter.interface';
import { MstHealthParameterUnitMapping } from '../../../core/database/models/mst-health-parameter-unit-mapping.model';
import { HealthParameterUnitService } from './health-parameter-unit.service';
import { IMemberHealthParameter } from '../../../response-interface/member-health-parameter.interface';
import { MstHealthParameterUnit } from '../../../core/database/models/mst-health-parameter-unit.model';
import * as _ from 'lodash';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class HealthParameterService {
  constructor(
    @InjectModel(MstHealthParameter) private readonly healthParameterRepository: typeof MstHealthParameter,
    @InjectModel(MstHealthParameterUnitMapping)
    private readonly healthParameterUnitMappingRepository: typeof MstHealthParameterUnitMapping,
    private healthParameterUnitService: HealthParameterUnitService,
    private exceptionService: ExceptionService,
  ) {}

  public async findAll(searchDto: BasicSearchDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'healthParameter');

      const pageNumber = searchDto.pageNumber;
      const pageSize = searchDto.pageSize;
      let offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

      const { rows, count } = await this.healthParameterRepository.findAndCountAll<MstHealthParameter>({
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
        order: [['healthParameter', 'ASC']],
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

      const resList: IHealthParameter[] = [];
      for (const s of rows) {
        const iEvent: IHealthParameter = {
          id: s.healthParameterId,
          name: s.healthParameter,
          sequence: s.sequence,
          hintText: s.hintText,
          fieldType: s.fieldType,
          requiredField: s.requiredField,
          active: s.active,
          imagePath: CommonFunctionsUtil.getImagesObj(s.imagePath),
          createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
          updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
          createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
          updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
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
      const find = await this.healthParameterRepository.findOne({
        where: {
          healthParameterId: id,
        },
      });
      if (find) {
        const dataObj = <IHealthParameter>{
          id: find.healthParameterId,
          name: find.healthParameter,
          sequence: find.sequence,
          fieldType: find.fieldType,
          requiredField: find.requiredField,
          hintText: find.hintText,
          active: find.active,
          imagePath: CommonFunctionsUtil.getImagesObj(find.imagePath),
          createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
          updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
          createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
          updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
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

  public async create(obj: CreateHealthParameterDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const createObj = {
        healthParameter: obj.name,
        sequence: obj.sequence,
        hintText: obj.hintText,
        fieldType: obj.fieldType,
        requiredField: obj.requiredField,
        imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
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
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async update(
    id: number,
    obj: CreateHealthParameterDto,
    cIp: string,
    adminId: number,
  ): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.healthParameterRepository.findOne({
        where: {
          healthParameterId: id,
        },
      });
      if (find) {
        const updateObj = {
          healthParameter: obj.name,
          sequence: obj.sequence,
          hintText: obj.hintText,
          fieldType: obj.fieldType,
          requiredField: obj.requiredField,
          imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
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
      this.exceptionService.logException(e);
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
      const find = await this.healthParameterRepository.findOne({
        where: {
          healthParameterId: id,
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
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async getHealthParameterWithUnitMapping(): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: await this.createDefaultHealthParameterLogs(),
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

  public async createDefaultHealthParameterLogs(): Promise<IMemberHealthParameter[]> {
    const promiseAll = await Promise.all([this.getHealthParameterList(), this.getHealthParameterUnitMappingList()]);
    const parameterList = promiseAll[0];
    const parameterUnitMappingList = promiseAll[1];
    const healthParameterWithUnits: IMemberHealthParameter[] = [];
    for (const s of parameterList) {
      const unitList = _.filter(parameterUnitMappingList, { healthParameterId: s.healthParameterId });
      const defaultOne = _.find(unitList, { defaultSelected: true });
      healthParameterWithUnits.push(<IMemberHealthParameter>{
        healthParameter: s.healthParameter,
        healthParameterId: s.healthParameterId,
        hintText: s.hintText,
        fieldType: s.fieldType,
        requiredField: s.requiredField,
        healthParameterUnitId: defaultOne ? defaultOne.healthParameterUnitId : null,
        healthParameterUnit: defaultOne ? defaultOne.healthParameterUnit : null,
        value: null,
        healthParameterUnitList: unitList ? unitList : [],
      });
    }
    return healthParameterWithUnits;
  }

  private async getHealthParameterList(): Promise<MstHealthParameter[]> {
    try {
      const tempList = await this.healthParameterRepository.findAll<MstHealthParameter>({
        where: {
          active: true,
        },
        order: [['sequence', 'asc']],
        raw: true,
        nest: true,
      });
      return tempList;
    } catch (e) {
      throw e;
    }
  }

  private async getHealthParameterUnitMappingList(): Promise<IHealthParameterUnitMapping[]> {
    try {
      const tempList = await this.healthParameterUnitMappingRepository.findAll<MstHealthParameterUnitMapping>({
        include: [
          {
            model: MstHealthParameterUnit,
            required: true,
            as: 'HealthParameterUnitMappingUnit',
            attributes: ['healthParameterUnit'],
          },
        ],
        where: {
          active: true,
        },
        raw: true,
        nest: true,
      });
      const list: IHealthParameterUnitMapping[] = [];
      for (const t of tempList) {
        list.push({
          healthParameterId: t.healthParameterId,
          healthParameterUnitId: t.healthParameterUnitId,
          healthParameterUnit: t['HealthParameterUnitMappingUnit']['healthParameterUnit'],
          defaultSelected: t.defaultSelected,
        });
      }
      return list;
    } catch (e) {
      throw e;
    }
  }

  private async createInDB(obj: any) {
    return await this.healthParameterRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.healthParameterRepository
      .update(obj, { where: { healthParameterId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }
}
