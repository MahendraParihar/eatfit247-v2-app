import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstIssueCategory } from '@server/common';
import { ITableList, IBasicSearch, IIssueCategory, IManageIssueCategory, IDropdownItem } from '@eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil } from '@server/common';

@Injectable()
export class IssueCategoryService {
  constructor(
    @InjectModel(MstIssueCategory) private readonly issueCategoryRepository: typeof MstIssueCategory,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IIssueCategory>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'issueCategory');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.issueCategoryRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['issueCategory', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IIssueCategory[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IIssueCategory {
    return <IIssueCategory>{
      issueCategoryId: item.issueCategoryId,
      id: item.issueCategoryId,
      issueCategory: item.issueCategory,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<IIssueCategory> {
    const find = await this.issueCategoryRepository.scope('details').findOne({
      where: { issueCategoryId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Issue category not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageIssueCategory, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      issueCategory: obj.issueCategory,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
    };
    await this.issueCategoryRepository.create(createObj);
  }

  public async update(id: number, obj: IManageIssueCategory, cIp: string, adminId: number): Promise<void> {
    const find = await this.issueCategoryRepository.findOne({ where: { issueCategoryId: id } });
    if (!find) {
      throw new NotFoundException('Issue category not found');
    }
    const updateObj = {
      issueCategory: obj.issueCategory,
      active: obj.active,
      modifiedBy: adminId,
    };
    await this.issueCategoryRepository.update(updateObj, { where: { issueCategoryId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.issueCategoryRepository.findOne({ where: { issueCategoryId: id } });
    if (!find) {
      throw new NotFoundException('Issue category not found');
    }
    await this.issueCategoryRepository.update({ active, modifiedBy: adminId }, { where: { issueCategoryId: id } });
  }

  public async getIssueCategoryList(): Promise<IDropdownItem[]> {
    const tempList = await this.issueCategoryRepository.findAll<MstIssueCategory>({
      where: { active: true },
      order: [['issueCategory', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.issueCategoryId, label: t.issueCategory, selected: false }));
  }
}

