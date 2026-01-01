import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstHealthParameter } from '@server/common';
import { ITableList, IBasicSearch, IHealthParameter, IManageHealthParameter, IDropdownItem, ConfigParam } from '@eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server/common';

@Injectable()
export class HealthParameterService {
  constructor(
    @InjectModel(MstHealthParameter) private readonly healthParameterRepository: typeof MstHealthParameter,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IHealthParameter>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'healthParameter');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.healthParameterRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['sequence', 'ASC'], ['healthParameter', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IHealthParameter[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IHealthParameter {
    return <IHealthParameter>{
      healthParameterId: item.healthParameterId,
      id: item.healthParameterId,
      healthParameter: item.healthParameter,
      hintText: item.hintText,
      imagePath: CommonFunctionsUtil.buildImageUrl(
        item.imagePath,
        this.appConfigService.getString(ConfigParam.CLIENT_URL),
      ),
      isLength: item.isLength,
      sequence: item.sequence,
      fieldType: item.fieldType,
      requiredField: item.requiredField,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<IHealthParameter> {
    const find = await this.healthParameterRepository.scope('details').findOne({
      where: { healthParameterId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Health parameter not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageHealthParameter, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      healthParameter: obj.healthParameter,
      hintText: obj.hintText,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      isLength: obj.isLength,
      sequence: obj.sequence,
      fieldType: obj.fieldType,
      requiredField: obj.requiredField,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.healthParameterRepository.create(createObj);
  }

  public async update(id: number, obj: IManageHealthParameter, cIp: string, adminId: number): Promise<void> {
    const find = await this.healthParameterRepository.findOne({ where: { healthParameterId: id } });
    if (!find) {
      throw new NotFoundException('Health parameter not found');
    }
    const updateObj = {
      healthParameter: obj.healthParameter,
      hintText: obj.hintText,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      isLength: obj.isLength,
      sequence: obj.sequence,
      fieldType: obj.fieldType,
      requiredField: obj.requiredField,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.healthParameterRepository.update(updateObj, { where: { healthParameterId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.healthParameterRepository.findOne({ where: { healthParameterId: id } });
    if (!find) {
      throw new NotFoundException('Health parameter not found');
    }
    await this.healthParameterRepository.update({ active, modifiedBy: adminId, modifiedIp: cIp }, { where: { healthParameterId: id } });
  }

  public async getHealthParameterList(): Promise<IDropdownItem[]> {
    const tempList = await this.healthParameterRepository.findAll<MstHealthParameter>({
      where: { active: true },
      order: [['sequence', 'ASC'], ['healthParameter', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.healthParameterId, label: t.healthParameter, selected: false }));
  }
}

