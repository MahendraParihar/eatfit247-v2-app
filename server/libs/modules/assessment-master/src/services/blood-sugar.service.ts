import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstBloodSugar } from '@server/common';
import { ITableList, IBasicSearch, IBloodSugar, IManageBloodSugar, IDropdownItem, ConfigParam } from '@eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server/common';

@Injectable()
export class BloodSugarService {
  constructor(
    @InjectModel(MstBloodSugar) private readonly bloodSugarRepository: typeof MstBloodSugar,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IBloodSugar>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'bloodSugar');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.bloodSugarRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['bloodSugar', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IBloodSugar[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IBloodSugar {
    return <IBloodSugar>{
      bloodSugarId: item.bloodSugarId,
      id: item.bloodSugarId,
      bloodSugar: item.bloodSugar,
      imagePath: CommonFunctionsUtil.buildImageUrl(
        item.imagePath,
        this.appConfigService.getString(ConfigParam.CLIENT_URL),
      ),
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<IBloodSugar> {
    const find = await this.bloodSugarRepository.scope('details').findOne({
      where: { bloodSugarId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Blood sugar not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageBloodSugar, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      bloodSugar: obj.bloodSugar,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.bloodSugarRepository.create(createObj);
  }

  public async update(id: number, obj: IManageBloodSugar, cIp: string, adminId: number): Promise<void> {
    const find = await this.bloodSugarRepository.findOne({ where: { bloodSugarId: id } });
    if (!find) {
      throw new NotFoundException('Blood sugar not found');
    }
    const updateObj = {
      bloodSugar: obj.bloodSugar,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.bloodSugarRepository.update(updateObj, { where: { bloodSugarId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.bloodSugarRepository.findOne({ where: { bloodSugarId: id } });
    if (!find) {
      throw new NotFoundException('Blood sugar not found');
    }
    await this.bloodSugarRepository.update({ active, modifiedBy: adminId, modifiedIp: cIp }, { where: { bloodSugarId: id } });
  }

  public async getBloodSugarList(): Promise<IDropdownItem[]> {
    const tempList = await this.bloodSugarRepository.findAll<MstBloodSugar>({
      where: { active: true },
      order: [['bloodSugar', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.bloodSugarId, label: t.bloodSugar, selected: false }));
  }
}

