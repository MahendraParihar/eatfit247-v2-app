import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from '../../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch } from 'shared-lib';
import { ILov } from 'shared-lib';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import moment from 'moment';
import { CreateLovDto } from '../dto/lov.dto';
import { MstFaqCategory } from '../../../core/database/models/mst-faq-category.model';
import { IDropdownItem } from 'shared-lib';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class FaqCategoryService {
  constructor(
    @InjectModel(MstFaqCategory) private readonly faqCategoryRepository: typeof MstFaqCategory,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ILov>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'faqCategory');

    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.faqCategoryRepository.findAndCountAll<MstFaqCategory>({
      include: [
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
      order: [['faqCategory', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: ILov[] = [];
    for (const s of rows) {
      const iEvent: ILov = {
        id: s.faqCategoryId,
        name: s.faqCategory,
        active: s.active,
        createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      };
      resList.push(iEvent);
    }

    return <ITableList<ILov>>{
      data: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<ILov> {
    const find = await this.faqCategoryRepository.findOne({
      where: {
        faqCategoryId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return <ILov>{
      id: find.faqCategoryId,
      name: find.faqCategory,
      active: find.active,
      createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    };
  }

  public async create(obj: CreateLovDto, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      faqCategory: obj.name,
      url: CommonFunctionsUtil.removeSpecialChar(obj.name.toString().toLowerCase(), '-'),
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.createInDB(createObj);
  }

  public async update(id: number, obj: CreateLovDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.faqCategoryRepository.findOne({
      where: {
        faqCategoryId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      faqCategory: obj.name,
      active: obj.active != null ? obj.active : find.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.faqCategoryRepository.findOne({
      where: {
        faqCategoryId: id,
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

  public async getFaqCategoryList(): Promise<IDropdownItem[]> {
    const tempList = await this.faqCategoryRepository.findAll<MstFaqCategory>({
      where: {
        active: true,
      },
      order: [['faqCategory', 'ASC']],
    });
    const list: IDropdownItem[] = [];
    for (const t of tempList) {
      list.push({
        id: t.faqCategoryId,
        label: t.faqCategory,
        selected: false,
      });
    }
    return list;
  }

  private async createInDB(obj: any) {
    return await this.faqCategoryRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.faqCategoryRepository.update(obj, { where: { faqCategoryId: id } });
  }
}
