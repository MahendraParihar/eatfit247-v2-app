import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from '../../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch } from 'shared-lib';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import moment from 'moment';
import { MstState } from '../../../core/database/models/mst-state.model';
import { CreateStateDto } from '../dto/state.dto';
import { IState } from 'shared-lib';
import { MstCountries } from '../../../core/database/models/mst-countries.model';
import { IDropdownItem } from 'shared-lib';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class StateService {
  constructor(@InjectModel(MstState) private readonly stateRepository: typeof MstState) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IState>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'state');

    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.stateRepository.findAndCountAll<MstState>({
      include: [
        {
          model: MstCountries,
          required: false,
          as: 'Country',
          attributes: ['country'],
        },
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
      order: [['state', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IState[] = [];
    for (const s of rows) {
      const iEvent: IState = {
        id: s.stateId,
        name: s.state,
        code: s.code,
        countryId: s.countryId,
        country: s['Country']['country'],
        active: s.active,
        createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      };
      resList.push(iEvent);
    }

    return <ITableList<IState>>{
      data: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IState> {
    const find = await this.stateRepository.findOne({
      where: {
        stateId: id,
      },
      include: [
        {
          model: MstCountries,
          required: false,
          as: 'Country',
          attributes: ['country'],
        },
      ],
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return <IState>{
      id: find.stateId,
      name: find.state,
      code: find.code,
      countryId: find.countryId,
      country: find['Country']['country'],
      active: find.active,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    };
  }

  public async create(obj: CreateStateDto, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      state: obj.name,
      code: obj.code,
      countryId: obj.countryId,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.createInDB(createObj);
  }

  public async update(id: number, obj: CreateStateDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.stateRepository.findOne({
      where: {
        stateId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      state: obj.name,
      code: obj.code,
      countryId: obj.countryId,
      active: obj.active != null ? obj.active : find.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.stateRepository.findOne({
      where: {
        stateId: id,
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

  public async getStateList(): Promise<IDropdownItem[]> {
    const tempList = await this.stateRepository.findAll<MstState>({
      where: {
        active: true,
      },
    });
    const list: IDropdownItem[] = [];
    for (const t of tempList) {
      list.push({
        id: t.stateId,
        label: t.state,
        parentId: t.countryId,
        selected: false,
      });
    }
    return list;
  }

  private async createInDB(obj: any) {
    return await this.stateRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.stateRepository.update(obj, { where: { stateId: id } });
  }
}
