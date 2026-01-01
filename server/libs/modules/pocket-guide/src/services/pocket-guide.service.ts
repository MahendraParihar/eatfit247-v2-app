import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstPocketGuide } from '@server/common';
import { ITableList, IBasicSearch, IPocketGuide, IManagePocketGuide, ConfigParam } from '@eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server/common';

@Injectable()
export class PocketGuideService {
  constructor(
    @InjectModel(MstPocketGuide) private readonly pocketGuideRepository: typeof MstPocketGuide,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IPocketGuide>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'pocketGuide');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.pocketGuideRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['pocketGuide', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IPocketGuide[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IPocketGuide {
    return <IPocketGuide>{
      pocketGuideId: item.pocketGuideId,
      id: item.pocketGuideId,
      pocketGuide: item.pocketGuide,
      filePath: CommonFunctionsUtil.buildImageUrl(item.filePath, this.appConfigService.getString(ConfigParam.CLIENT_URL)),
      description: item.description,
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

  public async fetchById(id: number): Promise<IPocketGuide> {
    const find = await this.pocketGuideRepository.scope('details').findOne({
      where: { pocketGuideId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Pocket guide not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManagePocketGuide, cIp: string, adminId: number): Promise<void> {
    const createObj = <MstPocketGuide>{
      pocketGuide: obj.pocketGuide,
      filePath: obj.filePath && obj.filePath.length > 0 ? obj.filePath : null,
      description: obj.description || null,
      imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.pocketGuideRepository.create(createObj);
  }

  public async update(id: number, obj: IManagePocketGuide, cIp: string, adminId: number): Promise<void> {
    const find = await this.pocketGuideRepository.findOne({
      where: { pocketGuideId: id },
    });
    if (!find) {
      throw new NotFoundException('Pocket guide not found');
    }
    const updateObj = <MstPocketGuide>{
      pocketGuide: obj.pocketGuide,
      filePath: obj.filePath && obj.filePath.length > 0 ? obj.filePath : null,
      description: obj.description || null,
      imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.pocketGuideRepository.update(updateObj, { where: { pocketGuideId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.pocketGuideRepository.findOne({
      where: { pocketGuideId: id },
    });
    if (!find) {
      throw new NotFoundException('Pocket guide not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.pocketGuideRepository.update(updateObj, { where: { pocketGuideId: id } });
  }
}

