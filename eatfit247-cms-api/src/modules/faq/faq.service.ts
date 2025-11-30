import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BasicSearchDto, UpdateActiveDto } from '../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from '../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch } from 'shared-lib';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import moment from 'moment';
import { TxnFaqs } from '../../core/database/models/txn-faqs.model';
import { IFaq } from 'shared-lib';
import { CreateFaqDto } from './dto/faq.dto';
import { MstFaqCategory } from '../../core/database/models/mst-faq-category.model';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class FaqService {
  constructor(@InjectModel(TxnFaqs) private readonly faqRepository: typeof TxnFaqs) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IFaq>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'faq');

    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.faqRepository.findAndCountAll<TxnFaqs>({
      include: [
        {
          model: MstFaqCategory,
          required: false,
          as: 'FaqCategory',
          attributes: ['faqCategory'],
        },
        {
          model: MstAdminUser,
          required: false,
          as: 'CreatedBy',
          attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
        },
        {
          model: MstAdminUser,
          required: false,
          as: 'ModifiedBy',
          attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
        },
      ],
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

    const resList: IFaq[] = [];
    for (const s of rows) {
      const iEvent: IFaq = {
        id: s.faqId,
        faq: s.faq,
        faqCategoryId: s.faqCategoryId,
        faqCategory: s['FaqCategory']['faqCategory'],
        answer: s.answer,
        active: s.active,
        createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      };
      resList.push(iEvent);
    }

    return <ITableList<IFaq>>{
      data: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IFaq> {
    const find = await this.faqRepository.findOne({
      where: {
        faqId: id,
      },
      include: [
        {
          model: MstFaqCategory,
          required: false,
          as: 'FaqCategory',
          attributes: ['faqCategory'],
        },
      ],
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return <IFaq>{
      id: find.faqId,
      faq: find.faq,
      faqCategoryId: find.faqCategoryId,
      faqCategory: find['FaqCategory']['faqCategory'],
      answer: find.answer,
      active: find.active,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    };
  }

  public async create(obj: CreateFaqDto, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      faqCategoryId: obj.faqCategoryId,
      faq: obj.faq,
      answer: obj.answer,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.createInDB(createObj);
  }

  public async update(id: number, obj: CreateFaqDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.faqRepository.findOne({
      where: {
        faqId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
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

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.faqRepository.findOne({
      where: {
        faqId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      active: obj.active,
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
