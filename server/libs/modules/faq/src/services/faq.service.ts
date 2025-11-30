import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnFaq } from '../models';
import { ITableList, IBasicSearch, IFaq, IManageFaq } from 'eatfit247-shared-lib';
import {
  SearchUtil,
} from '@server/common';

@Injectable()
export class FaqService {
  constructor(
    @InjectModel(TxnFaq) private readonly faqRepository: typeof TxnFaq,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IFaq>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'faq');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.faqRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [
        ['faqCategoryId', 'ASC'],
        ['faq', 'ASC'],
      ],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IFaq[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      data: resList,
      count: count,
    };
  }

  private convertToModel(item: TxnFaq) {
    return <IFaq>{
      faqId: item.faqId,
      id: item.faqId,
      faq: item.faq,
      faqCategoryId: item.faqCategoryId,
      faqCategory: item.faqCategory?.faqCategory || '',
      answer: item.answer,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser,
      updatedByUser: item.updatedByUser,
    };
  }

  public async fetchById(id: number): Promise<IFaq> {
    const find = await this.faqRepository.scope('details').findOne({
      where: {
        faqId: id,
      },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('FAQ not found');
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
      modifiedIp: cIp,
    };
    await this.createInDB(createObj);
  }

  public async update(id: number, obj: IManageFaq, cIp: string, adminId: number): Promise<void> {
    const find = await this.faqRepository.findOne({
      where: {
        faqId: id,
      },
    });
    if (!find) {
      throw new NotFoundException('FAQ not found');
    }
    const updateObj = {
      faqCategoryId: obj.faqCategoryId,
      faq: obj.faq,
      answer: obj.answer,
      active: obj.active != null ? obj.active : find.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.faqRepository.findOne({
      where: {
        faqId: id,
      },
    });
    if (!find) {
      throw new NotFoundException('FAQ not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  private async createInDB(obj: any) {
    return await this.faqRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.faqRepository.update(obj, { where: { faqId: id } });
  }
}

