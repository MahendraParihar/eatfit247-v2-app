import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstProgramPlan } from '../models';
import { ITableList, IBasicSearch, IProgramPlan, IManageProgramPlan, ConfigParam } from 'eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server/common';

@Injectable()
export class ProgramPlanService {
  constructor(
    @InjectModel(MstProgramPlan) private readonly programPlanRepository: typeof MstProgramPlan,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IProgramPlan>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'plan');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.programPlanRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [
        ['programPlanTypeId', 'ASC'],
        ['sequenceNumber', 'ASC'],
      ],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IProgramPlan[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IProgramPlan {
    return <IProgramPlan>{
      programPlanId: item.programPlanId,
      id: item.programPlanId,
      plan: item.plan,
      url: item.url,
      details: item.details,
      tags: item.tags ? item.tags.split(', ') : undefined,
      sequenceNumber: item.sequenceNumber,
      inrAmount: item.inrAmount,
      noOfCycle: item.noOfCycle,
      noOfDaysInCycle: item.noOfDaysInCycle,
      programPlanTypeId: item.programPlanTypeId,
      programPlanType: item.programPlanType?.programPlanType || '',
      isOnline: item.isOnline,
      isVisibleOnWeb: item.isVisibleOnWeb,
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

  public async fetchById(id: number): Promise<IProgramPlan> {
    const find = await this.programPlanRepository.scope('details').findOne({
      where: { programPlanId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Program plan not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageProgramPlan, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      plan: obj.plan,
      url: obj.url || CommonFunctionsUtil.removeSpecialChar(obj.plan.toString().toLowerCase(), '-'),
      details: obj.details || null,
      tags: obj.tags || null,
      sequenceNumber: obj.sequenceNumber,
      inrAmount: obj.inrAmount,
      noOfCycle: obj.noOfCycle,
      noOfDaysInCycle: obj.noOfDaysInCycle,
      programPlanTypeId: obj.programPlanTypeId,
      isOnline: obj.isOnline,
      isVisibleOnWeb: obj.isVisibleOnWeb,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.programPlanRepository.create(createObj);
  }

  public async update(id: number, obj: IManageProgramPlan, cIp: string, adminId: number): Promise<void> {
    const find = await this.programPlanRepository.findOne({
      where: { programPlanId: id },
    });
    if (!find) {
      throw new NotFoundException('Program plan not found');
    }
    const updateObj = {
      plan: obj.plan,
      url: obj.url || CommonFunctionsUtil.removeSpecialChar(obj.plan.toString().toLowerCase(), '-'),
      details: obj.details || null,
      tags: obj.tags || null,
      sequenceNumber: obj.sequenceNumber,
      inrAmount: obj.inrAmount,
      noOfCycle: obj.noOfCycle,
      noOfDaysInCycle: obj.noOfDaysInCycle,
      programPlanTypeId: obj.programPlanTypeId,
      isOnline: obj.isOnline,
      isVisibleOnWeb: obj.isVisibleOnWeb,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.programPlanRepository.update(updateObj, { where: { programPlanId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.programPlanRepository.findOne({
      where: { programPlanId: id },
    });
    if (!find) {
      throw new NotFoundException('Program plan not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.programPlanRepository.update(updateObj, { where: { programPlanId: id } });
  }
}

