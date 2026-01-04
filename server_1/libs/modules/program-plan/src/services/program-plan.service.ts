import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstProgramPlan, MstProgramPlanFees, MstProgramPlanType } from '../models';
import {
  ConfigParam,
  IBasicSearch,
  IDropdownItem,
  IManageProgramPlan,
  IProgramPlan,
  ITableList,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class ProgramPlanService {
  constructor(
    @InjectModel(MstProgramPlan) private readonly programPlanRepository: typeof MstProgramPlan,
    @InjectModel(MstProgramPlanType)
    private readonly programPlanTypeRepository: typeof MstProgramPlanType,
    @InjectModel(MstProgramPlanFees)
    private readonly programPlanFeesRepository: typeof MstProgramPlanFees,
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
        ['active', 'DESC'],
        ['sequenceNumber', 'ASC'],
      ],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IProgramPlan[] = rows.map((item: any) => {
      // Ensure programPlanFees is an array (might not be loaded in list scope)
      if (!item.programPlanFees) {
        item.programPlanFees = [];
      }
      return this.convertToModel(item);
    });
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IProgramPlan {
    const fees = Array.isArray(item.programPlanFees)
      ? item.programPlanFees.map((s: any) => ({
        fees: s.fees,
        currencyCode: s.currencyCode,
      }))
      : [];
    return <IProgramPlan>{
      programPlanId: item.programPlanId,
      plan: item.plan,
      url: item.url,
      details: item.details,
      sequenceNumber: item.sequenceNumber,
      noOfCycle: item.noOfCycle,
      noOfDaysInCycle: item.noOfDaysInCycle,
      programPlanTypeId: item.programPlanTypeId,
      programPlanType: item.programPlanType?.programPlanType || '',
      isOnline: item.isOnline,
      isVisibleOnWeb: item.isVisibleOnWeb,
      programPlanFees: fees,
      imagePath: CommonFunctionsUtil.buildImageUrl(
        item.imagePath,
        this.appConfigService.getString(ConfigParam.CLIENT_URL),
      ),
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
    };
  }

  public async fetchById(id: number): Promise<IProgramPlan> {
    const find = await this.programPlanRepository.scope('details').findOne({
      where: { programPlanId: id },
    });
    if (!find) {
      throw new NotFoundException('Program plan not found');
    }
    return this.convertToModel(find.get({ plain: true }));
  }

  public async create(obj: IManageProgramPlan, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      plan: obj.plan,
      url: CommonFunctionsUtil.removeSpecialChar(obj.plan.toString().toLowerCase(), '-'),
      details: obj.details || null,
      sequenceNumber: obj.sequenceNumber,
      noOfCycle: obj.noOfCycle,
      noOfDaysInCycle: obj.noOfDaysInCycle,
      programPlanTypeId: obj.programPlanTypeId,
      isOnline: obj.isOnline,
      isVisibleOnWeb: obj.isVisibleOnWeb,
      imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    const created = await this.programPlanRepository.create(createObj);
    // Create program plan fees
    if (obj.programPlanFees && obj.programPlanFees.length > 0) {
      // Validate no duplicate currency codes (enforced by unique index)
      const currencyCodes = obj.programPlanFees.map((fee) => fee.currencyCode);
      const uniqueCurrencyCodes = new Set(currencyCodes);
      if (currencyCodes.length !== uniqueCurrencyCodes.size) {
        throw new BadRequestException('Duplicate currency codes are not allowed for the same program plan');
      }
      const feesToCreate = obj.programPlanFees.map((fee) => ({
        programPlanId: created.programPlanId,
        currencyCode: fee.currencyCode,
        fees: fee.fees,
        active: true,
        createdBy: adminId,
        updatedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      }));
      await this.programPlanFeesRepository.bulkCreate(feesToCreate);
    }
  }

  public async update(
    id: number,
    obj: IManageProgramPlan,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.programPlanRepository.findOne({
      where: { programPlanId: id },
    });
    if (!find) {
      throw new NotFoundException('Program plan not found');
    }
    const updateObj = {
      plan: obj.plan,
      url: CommonFunctionsUtil.removeSpecialChar(obj.plan.toString().toLowerCase(), '-'),
      details: obj.details || null,
      sequenceNumber: obj.sequenceNumber,
      noOfCycle: obj.noOfCycle,
      noOfDaysInCycle: obj.noOfDaysInCycle,
      programPlanTypeId: obj.programPlanTypeId,
      isOnline: obj.isOnline,
      isVisibleOnWeb: obj.isVisibleOnWeb,
      imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.programPlanRepository.update(updateObj, { where: { programPlanId: id } });
    // Update program plan fees - delete existing and create new ones
    await this.programPlanFeesRepository.destroy({ where: { programPlanId: id } });
    if (obj.programPlanFees && obj.programPlanFees.length > 0) {
      // Validate no duplicate currency codes (enforced by unique index)
      const currencyCodes = obj.programPlanFees.map((fee) => fee.currencyCode);
      const uniqueCurrencyCodes = new Set(currencyCodes);
      if (currencyCodes.length !== uniqueCurrencyCodes.size) {
        throw new BadRequestException('Duplicate currency codes are not allowed for the same program plan');
      }
      const feesToCreate = obj.programPlanFees.map((fee) => ({
        programPlanId: id,
        currencyCode: fee.currencyCode,
        fees: fee.fees,
        active: true,
        createdBy: adminId,
        updatedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      }));
      await this.programPlanFeesRepository.bulkCreate(feesToCreate);
    }
  }

  public async changeStatus(
    id: number,
    active: boolean,
    cIp: string,
    adminId: number,
  ): Promise<void> {
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

  public async getProgramPlanTypeList(): Promise<IDropdownItem[]> {
    const tempList = await this.programPlanTypeRepository.findAll({
      where: { active: true },
      order: [['programPlanType', 'ASC']],
      raw: true,
      nest: true,
    });
    return tempList.map((t: any) => ({
      id: t.programPlanTypeId,
      label: t.programPlanType,
      isActive: t.active,
    }));
  }

  public async getProgramPlanList(): Promise<IDropdownItem[]> {
    const tempList = await this.programPlanRepository.scope('list').findAll({
      where: { active: true },
      order: [['plan', 'ASC']],
      raw: true,
      nest: true,
    });
    return tempList.map((t: any) => ({
      id: t.programPlanId,
      label: `${t.plan} (${t.noOfCycle} Cycle, ${t.noOfDaysInCycle} Days in a cycle, - ${t.isOnline ? 'Online' : 'Offline'})`,
      isActive: t.active,
    }));
  }
}

