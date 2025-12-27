import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { TxnDietTemplate, TxnDietTemplateDietDetail } from '../models';
import {
  ITableList,
  IBasicSearch,
  IDietTemplate,
  IManageDietTemplate,
  IDietTemplateDetail,
} from 'eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil } from '@server/common';

@Injectable()
export class DietTemplateService {
  constructor(
    @InjectModel(TxnDietTemplate)
    private readonly dietTemplateRepository: typeof TxnDietTemplate,
    @InjectModel(TxnDietTemplateDietDetail)
    private readonly dietTemplateDetailRepository: typeof TxnDietTemplateDietDetail,
    private readonly sequelize: Sequelize,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IDietTemplate>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'dietTemplate');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.dietTemplateRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['dietTemplate', 'ASC'], ['cycleNo', 'ASC'], ['dayNo', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: false,
      nest: true,
    });
    const resList: IDietTemplate[] = rows.map((item: TxnDietTemplate) => {
      return this.convertToModel(item.toJSON());
    });
    return {
      tableData: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IDietTemplate> {
    const find = await this.dietTemplateRepository.scope('details').findOne({
      where: { dietTemplateId: id },
      raw: false,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Diet template not found');
    }
    const template = find.toJSON();
    const dietDetails = await this.dietTemplateDetailRepository.findAll({
      where: { dietTemplateId: id },
      raw: false,
      nest: true,
    });
    const dietDetail = dietDetails.length > 0 ? this.convertDetailToModel(dietDetails[0].toJSON()) : undefined;
    return {
      ...this.convertToModel(template),
      dietDetail: dietDetail || {} as IDietTemplateDetail,
    };
  }

  public async create(obj: IManageDietTemplate, cIp: string, adminId: number): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const createObj: any = {
        dietTemplate: obj.dietTemplate,
        cycleNo: obj.cycleNo,
        dayNo: obj.dayNo,
        noOfCycle: obj.noOfCycle || null,
        daysInCycle: obj.noOfDaysInCycle || null,
        isWeekly: obj.isWeekly,
        active: true,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      };
      const created = await this.dietTemplateRepository.create(createObj, { transaction: t });
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async update(id: number, obj: IManageDietTemplate, cIp: string, adminId: number): Promise<void> {
    const find = await this.dietTemplateRepository.findOne({
      where: { dietTemplateId: id },
    });
    if (!find) {
      throw new NotFoundException('Diet template not found');
    }
    const t = await this.sequelize.transaction();
    try {
      const updateObj: any = {
        dietTemplate: obj.dietTemplate,
        cycleNo: obj.cycleNo,
        dayNo: obj.dayNo,
        noOfCycle: obj.noOfCycle || null,
        daysInCycle: obj.noOfDaysInCycle || null,
        isWeekly: obj.isWeekly,
        modifiedBy: adminId,
        modifiedIp: cIp,
      };
      await this.dietTemplateRepository.update(updateObj, {
        where: { dietTemplateId: id },
        transaction: t,
      });
      // Update or create diet detail
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.dietTemplateRepository.findOne({
      where: { dietTemplateId: id },
    });
    if (!find) {
      throw new NotFoundException('Diet template not found');
    }
    await this.dietTemplateRepository.update(
      {
        active,
        modifiedBy: adminId,
        modifiedIp: cIp,
      },
      { where: { dietTemplateId: id } },
    );
  }

  private convertToModel(item: any): IDietTemplate {
    return {
      dietTemplateId: item.dietTemplateId,
      dietTemplate: item.dietTemplate,
      cycleNo: item.cycleNo,
      dayNo: item.dayNo,
      noOfCycle: item.noOfCycle,
      noOfDaysInCycle: item.daysInCycle,
      isWeekly: item.isWeekly,
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
      dietDetail: {} as IDietTemplateDetail, // Will be populated separately
    };
  }

  private convertDetailToModel(item: any): IDietTemplateDetail {
    return {
      dietTemplateDietDetailId: item.dietTemplateDietDetailId,
      dietTemplateId: item.dietTemplateId,
      cycleNo: item.cycleNo,
      dayNo: item.dayNo,
      dietDetail: item.dietDetail,
    };
  }
}
