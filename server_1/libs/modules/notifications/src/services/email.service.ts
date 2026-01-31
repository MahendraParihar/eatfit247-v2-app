import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { IBasicSearch, IEmailTemplate, IManageEmailTemplate, ITableList } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, SearchUtil } from '@server_1/core';
import { MstEmailTemplate } from '@server_1/platform';

@Injectable()
export class EmailService {
  private readonly serviceName = 'EmailService';

  constructor(@InjectModel(MstEmailTemplate) private readonly emailTemplateRepository: typeof MstEmailTemplate) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IEmailTemplate>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'templateName');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.emailTemplateRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['templateName', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IEmailTemplate[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): IEmailTemplate {
    return <IEmailTemplate>{
      emailTemplateId: item.emailTemplateId,
      id: item.emailTemplateId,
      templateName: item.templateName,
      subject: item.subject,
      body: item.body,
      active: item.active,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<IEmailTemplate> {
    const find = await this.emailTemplateRepository.scope('details').findOne({
      where: { emailTemplateId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Email template not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageEmailTemplate, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      templateName: obj.templateName,
      subject: obj.subject,
      body: obj.body,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
    };
    await this.emailTemplateRepository.create(createObj);
  }

  public async update(id: number, obj: IManageEmailTemplate, cIp: string, adminId: number): Promise<void> {
    const find = await this.emailTemplateRepository.findOne({ where: { emailTemplateId: id } });
    if (!find) {
      throw new NotFoundException('Email template not found');
    }
    const updateObj = {
      templateName: obj.templateName,
      subject: obj.subject,
      body: obj.body,
      active: obj.active,
      modifiedBy: adminId,
    };
    await this.emailTemplateRepository.update(updateObj, { where: { emailTemplateId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.emailTemplateRepository.findOne({ where: { emailTemplateId: id } });
    if (!find) {
      throw new NotFoundException('Email template not found');
    }
    await this.emailTemplateRepository.update({ active, modifiedBy: adminId }, { where: { emailTemplateId: id } });
  }
}

