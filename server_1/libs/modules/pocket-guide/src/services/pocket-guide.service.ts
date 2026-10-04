import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstPocketGuide } from '../models';
import { IBasicSearch, IManagePocketGuide, IPocketGuide, ITableList } from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil, TableListSortUtil } from '@server_1/core';
import { IPocketGuideFile, PocketGuideFileUtil } from '../utils';

@Injectable()
export class PocketGuideService {
  private readonly logger = new Logger(PocketGuideService.name);

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
      order: TableListSortUtil.orderFromAllowlist(
        searchDto,
        new Set(['pocketGuideId', 'pocketGuide', 'description', 'active', 'createdAt', 'updatedAt']),
        [['pocketGuide', 'ASC']],
      ),
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
      filePath: CommonFunctionsUtil.buildImageUrl(item.filePath),
      hasFile: PocketGuideFileUtil.hasFile(item.filePath),
      downloadFileName: PocketGuideFileUtil.downloadFileNameFor(item.pocketGuide, item.filePath),
      description: item.description,
      imagePath: CommonFunctionsUtil.buildImageUrl(item.imagePath),
      active: item.active,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
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

  /** The guide's PDF for download. Inactive guides are included (only new assignments are blocked). */
  public async getDownloadFile(id: number): Promise<IPocketGuideFile> {
    const guide = await this.pocketGuideRepository.findOne({
      where: { pocketGuideId: id },
      attributes: ['pocketGuideId', 'pocketGuide', 'filePath'],
    });
    if (!guide) {
      throw new NotFoundException('Pocket guide not found');
    }
    const lookup = await PocketGuideFileUtil.locate(guide.pocketGuide, guide.filePath);
    if (lookup.found === false) {
      if (lookup.reason === 'missing') {
        this.logger.error(`Pocket guide ${id} file missing on disk: ${lookup.reference}`);
        throw new NotFoundException('Pocket guide file is missing on the server');
      }
      throw new NotFoundException('This pocket guide has no file');
    }
    return lookup.file;
  }

  public async create(obj: IManagePocketGuide, cIp: string, adminId: number): Promise<void> {
    const createObj = <MstPocketGuide>{
      pocketGuide: obj.pocketGuide,
      // file_path is NOT NULL in the DB: an empty array means "no file"
      filePath: obj.filePath && obj.filePath.length > 0 ? obj.filePath : [],
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
      // file_path is NOT NULL in the DB: an empty array means "no file"
      filePath: obj.filePath && obj.filePath.length > 0 ? obj.filePath : [],
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

