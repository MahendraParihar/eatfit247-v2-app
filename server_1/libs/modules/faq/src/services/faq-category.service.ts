import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstFaqCategory } from '../models';
import {
  IBasicSearch,
  IDropdownItem,
  IFaqCategory,
  IManageFaqCategory,
  IPublicFaqCategory,
  IStatusChange,
  ITableList,
} from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class FaqCategoryService {
  constructor(
    @InjectModel(MstFaqCategory) private readonly faqCategoryRepository: typeof MstFaqCategory,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IFaqCategory>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'faqCategory');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.faqCategoryRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['faqCategory', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IFaqCategory[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: MstFaqCategory) {
    return <IFaqCategory>{
      faqCategoryId: item.faqCategoryId,
      faqCategory: item.faqCategory,
      url: item.url,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser,
      updatedByUser: item.updatedByUser,
    };
  }

  public async fetchAll(): Promise<MstFaqCategory[]> {
    return await this.faqCategoryRepository.scope('list').findAll({
      where: { active: true },
      order: [['faqCategory', 'ASC']],
      raw: true,
      nest: true,
    });
  }

  public async fetchById(id: number): Promise<IFaqCategory> {
    const find = await this.faqCategoryRepository.scope('details').findOne({
      where: { faqCategoryId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('FAQ category not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageFaqCategory, requestedIp: string, userId: number): Promise<void> {
    const dataObj: any = {
      faqCategory: obj.faqCategory,
      url: obj.url || CommonFunctionsUtil.removeSpecialChar(obj.faqCategory),
      active: obj.active,
      createdBy: userId,
      modifiedBy: userId,
      createdIp: requestedIp,
      modifiedIp: requestedIp,
    };
    await this.faqCategoryRepository.create(dataObj);
  }

  public async update(id: number, obj: IManageFaqCategory, requestedIp: string, userId: number): Promise<void> {
    const find = await this.faqCategoryRepository.findOne({ where: { faqCategoryId: id } });
    if (!find) {
      throw new NotFoundException('FAQ category not found');
    }
    const dataObj: any = {
      faqCategory: obj.faqCategory,
      url: obj.url || CommonFunctionsUtil.removeSpecialChar(obj.faqCategory),
      active: obj.active,
      modifiedBy: userId,
      modifiedIp: requestedIp,
    };
    await this.faqCategoryRepository.update(dataObj, { where: { faqCategoryId: id } });
  }

  public async changeStatus(id: number, body: IStatusChange, requestedIp: string, userId: number): Promise<void> {
    const find = await this.faqCategoryRepository.findOne({ where: { faqCategoryId: id } });
    if (!find) {
      throw new NotFoundException('FAQ category not found');
    }
    await this.faqCategoryRepository.update(
      {
        active: body.active,
        modifiedBy: userId,
        modifiedIp: requestedIp,
      },
      { where: { faqCategoryId: id } },
    );
  }

  public async getFaqCategoryList(): Promise<IDropdownItem[]> {
    const tempList = await this.faqCategoryRepository.scope('list').findAll({
      where: {
        active: true,
      },
      order: [['faqCategory', 'ASC']],
      raw: true,
      nest: true,
    });
    const list: IDropdownItem[] = tempList.map((t: any) => ({
      id: t.faqCategoryId,
      label: t.faqCategory,
      isActive: t.active,
    }));
    return list;
  }

  /**
   * Public method to fetch all active FAQ categories
   */
  public async findAllPublic(): Promise<IPublicFaqCategory[]> {
    const categories = await this.faqCategoryRepository.scope('list').findAll({
      where: {
        active: true,
      },
      order: [['faqCategory', 'ASC']],
      raw: true,
      nest: true,
    });
    return categories.map((item: any) => this.convertToPublic(this.convertToModel(item)));
  }

  /**
   * Find FAQ category by URL
   * @param url - The URL slug of the category
   * @returns FAQ category or null if not found
   */
  public async findByUrl(url: string): Promise<IFaqCategory | null> {
    const find = await this.faqCategoryRepository.scope('list').findOne({
      where: {
        url: url,
        active: true,
      },
      raw: true,
      nest: true,
    });
    if (!find) {
      return null;
    }
    return this.convertToModel(find);
  }

  /**
   * Convert IFaqCategory to IPublicFaqCategory (removes admin fields)
   */
  private convertToPublic(category: IFaqCategory): IPublicFaqCategory {
    const { createdBy, updatedBy, createdAt, updatedAt, active, createdByUser, updatedByUser, ...publicCategory } = category;
    return publicCategory as IPublicFaqCategory;
  }
}

