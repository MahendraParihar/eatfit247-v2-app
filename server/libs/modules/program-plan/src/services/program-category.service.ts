import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstProgramCategory } from '@server/common';
import { ITableList, IBasicSearch, IProgramCategory, IManageProgramCategory, IDropdownItem, ConfigParam } from 'eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server/common';

@Injectable()
export class ProgramCategoryService {
  constructor(
    @InjectModel(MstProgramCategory) private readonly programCategoryRepository: typeof MstProgramCategory,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IProgramCategory>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'programCategory');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.programCategoryRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['programCategory', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IProgramCategory[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IProgramCategory {
    return <IProgramCategory>{
      programCategoryId: item.programCategoryId,
      id: item.programCategoryId,
      programCategory: item.programCategory,
      url: item.url,
      active: item.active,
      imagePath: CommonFunctionsUtil.buildImageUrl(
        item.imagePath,
        this.appConfigService.getString(ConfigParam.CLIENT_URL),
      ),
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchAll(): Promise<MstProgramCategory[]> {
    return await this.programCategoryRepository.scope('list').findAll({
      where: { active: true },
      order: [['programCategory', 'ASC']],
      raw: true,
      nest: true,
    });
  }

  public async fetchById(id: number): Promise<IProgramCategory> {
    const find = await this.programCategoryRepository.scope('details').findOne({
      where: { programCategoryId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Program category not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageProgramCategory, requestedIp: string, userId: number): Promise<void> {
    const dataObj: any = {
      programCategory: obj.programCategory,
      url: obj.url || CommonFunctionsUtil.removeSpecialChar(obj.programCategory.toString().toLowerCase(), '-'),
      active: obj.active,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      createdBy: userId,
      modifiedBy: userId,
      createdIp: requestedIp,
      modifiedIp: requestedIp,
    };
    await this.programCategoryRepository.create(dataObj);
  }

  public async update(id: number, obj: IManageProgramCategory, requestedIp: string, userId: number): Promise<void> {
    const find = await this.programCategoryRepository.findOne({ where: { programCategoryId: id } });
    if (!find) {
      throw new NotFoundException('Program category not found');
    }
    const dataObj: any = {
      programCategory: obj.programCategory,
      url: obj.url || CommonFunctionsUtil.removeSpecialChar(obj.programCategory.toString().toLowerCase(), '-'),
      active: obj.active,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      modifiedBy: userId,
      modifiedIp: requestedIp,
    };
    await this.programCategoryRepository.update(dataObj, { where: { programCategoryId: id } });
  }

  public async changeStatus(id: number, active: boolean, requestedIp: string, userId: number): Promise<void> {
    const find = await this.programCategoryRepository.findOne({ where: { programCategoryId: id } });
    if (!find) {
      throw new NotFoundException('Program category not found');
    }
    await this.programCategoryRepository.update(
      {
        active: active,
        modifiedBy: userId,
        modifiedIp: requestedIp,
      },
      { where: { programCategoryId: id } },
    );
  }

  public async getProgramCategoryList(): Promise<IDropdownItem[]> {
    const tempList = await this.programCategoryRepository.scope('list').findAll({
      where: {
        active: true,
      },
      order: [['programCategory', 'ASC']],
      raw: true,
      nest: true,
    });
    const list: IDropdownItem[] = tempList.map((t: any) => ({
      id: t.programCategoryId,
      label: t.programCategory,
      isActive: t.active,
    }));
    return list;
  }
}

