import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstSleepingPattern } from '@server/common';
import { ITableList, IBasicSearch, ISleepingPattern, IManageSleepingPattern, IDropdownItem, ConfigParam } from '@eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server/common';

@Injectable()
export class SleepingPatternService {
  constructor(
    @InjectModel(MstSleepingPattern) private readonly sleepingPatternRepository: typeof MstSleepingPattern,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ISleepingPattern>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'sleepingPattern');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.sleepingPatternRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['sleepingPattern', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: ISleepingPattern[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): ISleepingPattern {
    return <ISleepingPattern>{
      sleepingPatternId: item.sleepingPatternId,
      id: item.sleepingPatternId,
      sleepingPattern: item.sleepingPattern,
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

  public async fetchById(id: number): Promise<ISleepingPattern> {
    const find = await this.sleepingPatternRepository.scope('details').findOne({
      where: { sleepingPatternId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Sleeping pattern not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageSleepingPattern, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      sleepingPattern: obj.sleepingPattern,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.sleepingPatternRepository.create(createObj);
  }

  public async update(id: number, obj: IManageSleepingPattern, cIp: string, adminId: number): Promise<void> {
    const find = await this.sleepingPatternRepository.findOne({ where: { sleepingPatternId: id } });
    if (!find) {
      throw new NotFoundException('Sleeping pattern not found');
    }
    const updateObj = {
      sleepingPattern: obj.sleepingPattern,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.sleepingPatternRepository.update(updateObj, { where: { sleepingPatternId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.sleepingPatternRepository.findOne({ where: { sleepingPatternId: id } });
    if (!find) {
      throw new NotFoundException('Sleeping pattern not found');
    }
    await this.sleepingPatternRepository.update({ active, modifiedBy: adminId, modifiedIp: cIp }, { where: { sleepingPatternId: id } });
  }

  public async getSleepingPatternList(): Promise<IDropdownItem[]> {
    const tempList = await this.sleepingPatternRepository.findAll<MstSleepingPattern>({
      where: { active: true },
      order: [['sleepingPattern', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.sleepingPatternId, label: t.sleepingPattern, selected: false }));
  }
}

