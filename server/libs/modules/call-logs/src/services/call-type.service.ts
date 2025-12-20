import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstCallType } from '../models';
import { ITableList, IBasicSearch, ICallType, IManageCallType, IDropdownItem, ConfigParam } from 'eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server/common';

@Injectable()
export class CallTypeService {
  constructor(
    @InjectModel(MstCallType) private readonly callTypeRepository: typeof MstCallType,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ICallType>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'callType');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.callTypeRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['callType', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: ICallType[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): ICallType {
    return <ICallType>{
      callTypeId: item.callTypeId,
      id: item.callTypeId,
      callType: item.callType,
      imagePath: CommonFunctionsUtil.buildImageUrl(
        item.imagePath,
        this.appConfigService.getString(ConfigParam.CLIENT_URL),
      ),
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
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

  public async fetchById(id: number): Promise<ICallType> {
    const find = await this.callTypeRepository.scope('details').findOne({
      where: { callTypeId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Call type not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageCallType, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      callType: obj.callType,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.callTypeRepository.create(createObj);
  }

  public async update(id: number, obj: IManageCallType, cIp: string, adminId: number): Promise<void> {
    const find = await this.callTypeRepository.findOne({
      where: { callTypeId: id },
    });
    if (!find) {
      throw new NotFoundException('Call type not found');
    }
    const updateObj = {
      callType: obj.callType,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.callTypeRepository.update(updateObj, { where: { callTypeId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.callTypeRepository.findOne({
      where: { callTypeId: id },
    });
    if (!find) {
      throw new NotFoundException('Call type not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.callTypeRepository.update(updateObj, { where: { callTypeId: id } });
  }

  public async getCallTypeList(): Promise<IDropdownItem[]> {
    const tempList = await this.callTypeRepository.findAll<MstCallType>({
      where: { active: true },
      order: [['callType', 'ASC']],
    });
    return tempList.map((t) => ({
      id: t.callTypeId,
      label: t.callType,
      selected: false,
    }));
  }
}

