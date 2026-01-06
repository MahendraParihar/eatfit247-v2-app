import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigParam, IBasicSearch, ILegalPageList, IManageLegalPage, ITableList } from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil } from '@server_1/core';
import { LegalPagesModel } from '../models';

@Injectable()
export class LegalPagesService {
  constructor(
    @InjectModel(LegalPagesModel) private readonly legalPagesRepository: typeof LegalPagesModel,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ILegalPageList>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'title');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.legalPagesRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['title', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: ILegalPageList[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): ILegalPageList {
    return <ILegalPageList>{
      legalPageId: item.legalPageId,
      title: item.title,
      details: item.details,
      url: item.url,
      metaTitle: item.metaTitle,
      metaDescription: item.metaDescription,
      tags: item.tags,
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

  public async fetchById(id: number): Promise<ILegalPageList> {
    const find = await this.legalPagesRepository.scope('details').findOne({
      where: { legalPageId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Legal page not found');
    }
    return this.convertToModel(find);
  }

  public async getByUrl(url: string): Promise<ILegalPageList> {
    const find = await this.legalPagesRepository.scope('details').findOne({
      where: { url: url },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Legal page not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageLegalPage, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      title: obj.title,
      details: obj.details,
      url: obj.seo
        ? obj.seo.url
        : CommonFunctionsUtil.removeSpecialChar(obj.title.toString().toLowerCase(), '-'),
      metaTitle: obj.seo.metaTitle,
      metaDescription: obj.seo.metaDescription,
      tags: obj.seo.tags,
      imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.legalPagesRepository.create(createObj);
  }

  public async update(id: number, obj: IManageLegalPage, cIp: string, adminId: number): Promise<void> {
    const find = await this.legalPagesRepository.findOne({
      where: { legalPageId: id },
    });
    if (!find) {
      throw new NotFoundException('Legal page not found');
    }
    const updateObj = {
      title: obj.title,
      details: obj.details,
      url: obj.seo.url,
      metaTitle: obj.seo.metaTitle,
      metaDescription: obj.seo.metaDescription,
      tags: obj.seo.tags,
      imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.legalPagesRepository.update(updateObj, { where: { legalPageId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.legalPagesRepository.findOne({
      where: { legalPageId: id },
    });
    if (!find) {
      throw new NotFoundException('Legal page not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.legalPagesRepository.update(updateObj, { where: { legalPageId: id } });
  }
}

