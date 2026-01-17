import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnFaq } from '../models';
import { IBasicSearch, IFaq, IManageFaq, IPublicFaq, IPublicTableList, ITableList } from '@eatfit247-shared-lib';
import { SearchUtil } from '@server_1/core';
import { BasicSearchDto } from '@server_1/core';
import { FaqCategoryService } from './faq-category.service';

@Injectable()
export class FaqService {
  constructor(
    @InjectModel(TxnFaq) private readonly faqRepository: typeof TxnFaq,
    private readonly faqCategoryService: FaqCategoryService
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IFaq>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, "faq");
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.faqRepository.scope("list").findAndCountAll({
      where: whereCondition,
      order: [
        ["faqCategoryId", "ASC"],
        ["faq", "ASC"]
      ],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true
    });
    const resList: IFaq[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count
    };
  }

  private convertToModel(item: TxnFaq) {
    return <IFaq>{
      faqId: item.faqId,
      id: item.faqId,
      faq: item.faq,
      faqCategoryId: item.faqCategoryId,
      faqCategory: item.faqCategory?.faqCategory || "",
      answer: item.answer,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser,
      updatedByUser: item.updatedByUser
    };
  }

  public async fetchById(id: number): Promise<IFaq> {
    const find = await this.faqRepository.scope("details").findOne({
      where: {
        faqId: id
      },
      raw: true,
      nest: true
    });
    if (!find) {
      throw new NotFoundException("FAQ not found");
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageFaq, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      faqCategoryId: obj.faqCategoryId,
      faq: obj.faq,
      answer: obj.answer,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp
    };
    await this.createInDB(createObj);
  }

  public async update(id: number, obj: IManageFaq, cIp: string, adminId: number): Promise<void> {
    const find = await this.faqRepository.findOne({
      where: {
        faqId: id
      }
    });
    if (!find) {
      throw new NotFoundException("FAQ not found");
    }
    const updateObj = {
      faqCategoryId: obj.faqCategoryId,
      faq: obj.faq,
      answer: obj.answer,
      active: obj.active != null ? obj.active : find.active,
      modifiedBy: adminId,
      modifiedIp: cIp
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.faqRepository.findOne({
      where: {
        faqId: id
      }
    });
    if (!find) {
      throw new NotFoundException("FAQ not found");
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp
    };
    await this.updateInDB(id, updateObj);
  }

  private async createInDB(obj: any) {
    return await this.faqRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.faqRepository.update(obj, { where: { faqId: id } });
  }

  /**
   * Public method to fetch all active FAQs
   */
  public async findAllPublic(searchDto: BasicSearchDto): Promise<IPublicTableList<IPublicFaq>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, "faq");
    // Only show active FAQs for public
    whereCondition.active = true;
    // Filter by faqCategoryId if provided (from query parameters)
    if (searchDto.faqCategoryId) {
      whereCondition.faqCategoryId = searchDto.faqCategoryId;
    }
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.faqRepository.scope("list").findAndCountAll({
      where: whereCondition,
      order: [
        ["faqCategoryId", "ASC"],
        ["faq", "ASC"]
      ],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true
    });
    const resList: IPublicFaq[] = rows.map((item: any) => this.convertToPublic(this.convertToModel(item)));
    return {
      tableData: resList,
      count: count
    };
  }

  /**
   * Public method to fetch FAQs by category URL
   * @param categoryUrl - The URL slug of the FAQ category
   * @param searchDto - Optional search parameters
   * @returns List of FAQs for the category
   */
  public async findByCategoryUrl(categoryUrl: string, searchDto?: BasicSearchDto): Promise<IPublicTableList<IPublicFaq>> {
    // First, find the category by URL
    const category = await this.faqCategoryService.findByUrl(categoryUrl);
    if (!category) {
      // Return empty list if category not found
      return {
        tableData: [],
        count: 0
      };
    }

    // Now fetch FAQs for this category
    const searchParams: BasicSearchDto = {
      ...searchDto,
      faqCategoryId: category.faqCategoryId,
      active: true,
    };
    return await this.findAllPublic(searchParams);
  }

  /**
   * Convert IFaq to IPublicFaq (removes admin fields)
   */
  private convertToPublic(faq: IFaq): IPublicFaq {
    const { createdBy, updatedBy, createdAt, updatedAt, active, createdByUser, updatedByUser, ...publicFaq } = faq;
    return publicFaq as IPublicFaq;
  }
}

