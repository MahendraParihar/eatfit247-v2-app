import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { IBasicSearch, ICreateSeoPageDto, ISeoPageData, ITableList, IUpdateSeoPageDto } from '@eatfit247-shared-lib';
import { TableListSortUtil } from '@server_1/core';
import { Op } from 'sequelize';
import { SeoPageModel } from '../database/models/mst-seo-page.model';

@Injectable()
export class SeoPageService {
  constructor(
    @InjectModel(SeoPageModel) private readonly seoPageRepository: typeof SeoPageModel,
  ) {}

  public async findByUrl(url: string): Promise<ISeoPageData | null> {
    const find = await this.seoPageRepository.scope('details').findOne({
      where: { url: url, active: true },
      raw: true,
      nest: true,
    });
    
    if (!find) {
      return null;
    }
    
    return this.convertToModel(find);
  }

  private convertToModel(item: any): ISeoPageData {
    return <ISeoPageData>{
      seoPageId: item.seoPageId,
      url: item.url,
      metaTitle: item.metaTitle,
      metaDescription: item.metaDescription,
      canonicalUrl: item.canonicalUrl,
      ogType: item.ogType,
      ogTitle: item.ogTitle,
      ogDescription: item.ogDescription,
      ogUrl: item.ogUrl,
      twitterCard: item.twitterCard,
      active: item.active,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  public async findAll(): Promise<ISeoPageData[]> {
    const rows = await this.seoPageRepository.scope('list').findAll({
      where: { active: true },
      order: [['url', 'ASC']],
      raw: true,
      nest: true,
    });

    return rows.map((item: any) => this.convertToModel(item));
  }

  public async findAllForAdmin(searchDto: IBasicSearch): Promise<ITableList<ISeoPageData>> {
    const whereCondition: any = {};
    if (searchDto.search?.trim()) {
      const term = searchDto.search.trim();
      whereCondition[Op.or] = [
        { url: { [Op.iLike]: `%${term}%` } },
        { metaTitle: { [Op.iLike]: `%${term}%` } },
      ];
    }
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.seoPageRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: TableListSortUtil.orderFromAllowlist(
        searchDto,
        new Set(['seoPageId', 'url', 'metaTitle', 'active', 'createdAt', 'updatedAt']),
        [['url', 'ASC']],
      ),
      offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    return {
      tableData: rows.map((item: any) => this.convertToModel(item)),
      count,
    };
  }

  public async findById(id: number): Promise<ISeoPageData> {
    const find = await this.seoPageRepository.scope('details').findOne({
      where: { seoPageId: id },
      raw: true,
      nest: true,
    });
    
    if (!find) {
      throw new NotFoundException('SEO page not found');
    }
    
    return this.convertToModel(find);
  }

  public async create(obj: ICreateSeoPageDto, cIp: string, adminId: number): Promise<ISeoPageData> {
    const createObj = {
      url: obj.url,
      metaTitle: obj.metaTitle,
      metaDescription: obj.metaDescription,
      canonicalUrl: obj.canonicalUrl,
      ogType: obj.ogType,
      ogTitle: obj.ogTitle,
      ogDescription: obj.ogDescription,
      ogUrl: obj.ogUrl,
      twitterCard: obj.twitterCard,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    
    const created = await this.seoPageRepository.create(createObj);
    return this.convertToModel(created.toJSON());
  }

  public async update(id: number, obj: IUpdateSeoPageDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.seoPageRepository.findOne({
      where: { seoPageId: id },
    });
    
    if (!find) {
      throw new NotFoundException('SEO page not found');
    }
    
    const updateObj = {
      url: obj.url,
      metaTitle: obj.metaTitle,
      metaDescription: obj.metaDescription,
      canonicalUrl: obj.canonicalUrl,
      ogType: obj.ogType,
      ogTitle: obj.ogTitle,
      ogDescription: obj.ogDescription,
      ogUrl: obj.ogUrl,
      twitterCard: obj.twitterCard,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    
    await this.seoPageRepository.update(updateObj, { where: { seoPageId: id } });
  }

  public async upsertByUrl(obj: ICreateSeoPageDto, cIp: string, adminId: number): Promise<ISeoPageData> {
    const existing = await this.seoPageRepository.findOne({
      where: { url: obj.url },
    });

    if (existing) {
      const updateObj = {
        metaTitle: obj.metaTitle,
        metaDescription: obj.metaDescription,
        canonicalUrl: obj.canonicalUrl,
        ogType: obj.ogType,
        ogTitle: obj.ogTitle,
        ogDescription: obj.ogDescription,
        ogUrl: obj.ogUrl,
        twitterCard: obj.twitterCard,
        active: obj.active,
        modifiedBy: adminId,
        modifiedIp: cIp,
      };
      
      await this.seoPageRepository.update(updateObj, { where: { seoPageId: existing.seoPageId } });
      const updated = await this.seoPageRepository.findOne({ where: { seoPageId: existing.seoPageId } });
      return this.convertToModel(updated!.toJSON());
    } else {
      return await this.create(obj, cIp, adminId);
    }
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.seoPageRepository.findOne({
      where: { seoPageId: id },
    });
    
    if (!find) {
      throw new NotFoundException('SEO page not found');
    }
    
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    
    await this.seoPageRepository.update(updateObj, { where: { seoPageId: id } });
  }
}

