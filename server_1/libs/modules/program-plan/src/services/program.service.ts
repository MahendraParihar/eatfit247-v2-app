import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstProgram } from '../models';
import {
  IBasicSearch,
  IDropdownItem,
  IManageProgram,
  IProgram,
  IProgramPlan,
  IPublicProgram,
  IPublicTableList,
  ITableList,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil, TableListSortUtil } from '@server_1/core';
import { ProgramPlanService } from './program-plan.service';

@Injectable()
export class ProgramService {
  constructor(
    @InjectModel(MstProgram) private readonly programRepository: typeof MstProgram,
    private appConfigService: AppConfigService,
    private readonly programPlanService: ProgramPlanService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IProgram>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'program');
    if (searchDto.isSpecialProgram !== null && searchDto.isSpecialProgram !== undefined) {
      whereCondition.isSpecialProgram = searchDto.isSpecialProgram;
    }
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.programRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: TableListSortUtil.orderFromAllowlist(
        searchDto,
        new Set([
          'programId',
          'program',
          'sequenceNumber',
          'url',
          'active',
          'createdAt',
          'updatedAt',
        ]),
        [['sequenceNumber', 'ASC']],
      ),
      offset: offset,
      limit: pageSize,
      nest: true,
    });
    const resList: IProgram[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private toDateOnly(value: string | Date | null | undefined): string | null {
    if (!value) {
      return null;
    }
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) {
      return null;
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private convertToModel(item: any): IProgram {
    return <IProgram>{
      programId: item.programId,
      id: item.programId,
      program: item.program,
      punchLine: item.punchLine,
      details: item.details,
      idealFor: item.idealFor,
      sequenceNumber: item.sequenceNumber,
      isSpecialProgram: item.isSpecialProgram,
      videoUrl: item.videoUrl,
      startDate: item.startDate,
      endDate: item.endDate,
      maxPeopleCanRegister: item.maxPeopleCanRegister,
      programPlanId: item.programPlanId ?? null,
      programPlan: this.convertProgramPlan(item.programPlan),
      seo: {
        url: item.url,
      },
      imagePath: CommonFunctionsUtil.buildImageUrl(item.imagePath),
      active: item.active,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
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

  private convertProgramPlan(plan: any): IProgramPlan | null {
    if (!plan) {
      return null;
    }
    const fees = Array.isArray(plan.programPlanFees)
      ? plan.programPlanFees.map((s: any) => ({
          fees: s.fees,
          currencyCode: s.currencyCode,
        }))
      : [];
    return <IProgramPlan>{
      programPlanId: plan.programPlanId,
      plan: plan.plan,
      details: plan.details,
      sequenceNumber: plan.sequenceNumber,
      noOfCycle: plan.noOfCycle,
      noOfDaysInCycle: plan.noOfDaysInCycle,
      isOnline: plan.isOnline,
      isVisibleOnWeb: plan.isVisibleOnWeb,
      programPlanFees: fees,
      imagePath: CommonFunctionsUtil.buildImageUrl(plan.imagePath),
      active: plan.active,
    };
  }

  public async fetchById(id: number): Promise<IProgram> {
    const find = await this.programRepository.scope('details').findOne({
      where: { programId: id },
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Program not found');
    }
    return this.convertToModel(find.get({ plain: true }));
  }

  public async create(obj: IManageProgram, cIp: string, adminId: number): Promise<void> {
    let programPlanId: number | null = null;
    if (obj.isSpecialProgram && obj.programPlan) {
      programPlanId = await this.programPlanService.create(obj.programPlan, cIp, adminId);
    }
    const createObj = {
      program: obj.program,
      punchLine: obj.punchLine,
      details: obj.details,
      idealFor: obj.idealFor,
      sequenceNumber: obj.sequenceNumber,
      isSpecialProgram: obj.isSpecialProgram,
      videoUrl: obj.videoUrl,
      startDate: obj.isSpecialProgram ? this.toDateOnly(obj.startDate) : null,
      endDate: obj.isSpecialProgram ? this.toDateOnly(obj.endDate) : null,
      maxPeopleCanRegister: obj.isSpecialProgram ? obj.maxPeopleCanRegister ?? null : null,
      programPlanId,
      url: obj.seo ? obj.seo.url : CommonFunctionsUtil.removeSpecialChar(obj.program.toString().toLowerCase(), '-'),
      imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.programRepository.create(createObj);
  }

  public async update(id: number, obj: IManageProgram, cIp: string, adminId: number): Promise<void> {
    const find = await this.programRepository.findOne({
      where: { programId: id },
    });
    if (!find) {
      throw new NotFoundException('Program not found');
    }
    let programPlanId: number | null = find.programPlanId ?? null;
    if (obj.isSpecialProgram) {
      if (obj.programPlan) {
        if (programPlanId) {
          await this.programPlanService.update(programPlanId, obj.programPlan, cIp, adminId);
        } else {
          programPlanId = await this.programPlanService.create(obj.programPlan, cIp, adminId);
        }
      }
    } else if (programPlanId) {
      // Unlinking a previously-tagged plan when seasonal is turned off.
      // Soft-delete the plan (active=false) so it disappears from active lists
      // but is preserved for audit/history. The FK on the program is cleared.
      // Frontend MUST confirm with the user before submitting this transition.
      await this.programPlanService.changeStatus(programPlanId, false, cIp, adminId);
      programPlanId = null;
    }
    const updateObj = {
      program: obj.program,
      punchLine: obj.punchLine,
      details: obj.details,
      idealFor: obj.idealFor,
      sequenceNumber: obj.sequenceNumber,
      isSpecialProgram: obj.isSpecialProgram,
      videoUrl: obj.videoUrl,
      startDate: obj.isSpecialProgram ? this.toDateOnly(obj.startDate) : null,
      endDate: obj.isSpecialProgram ? this.toDateOnly(obj.endDate) : null,
      maxPeopleCanRegister: obj.isSpecialProgram ? obj.maxPeopleCanRegister ?? null : null,
      programPlanId,
      url: obj.seo
        ? obj.seo.url
        : CommonFunctionsUtil.removeSpecialChar(obj.program.toString().toLowerCase(), '-'),
      imagePath: obj.imagePath && obj.imagePath.length > 0 ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.programRepository.update(updateObj, { where: { programId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.programRepository.findOne({
      where: { programId: id },
    });
    if (!find) {
      throw new NotFoundException('Program not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.programRepository.update(updateObj, { where: { programId: id } });
  }

  public async getProgramList(): Promise<IDropdownItem[]> {
    const tempList = await this.programRepository.scope('list').findAll({
      where: { active: true },
      order: [['program', 'ASC']],
      raw: true,
      nest: true,
    });
    return tempList.map((t: any) => ({
      id: t.programId,
      label: t.program,
      isActive: t.active,
    }));
  }

  /**
   * Public method to fetch all active programs
   */
  public async findAllPublic(searchDto: IBasicSearch): Promise<IPublicTableList<IPublicProgram>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'program');
    // Only show active programs for public
    whereCondition.active = true;
    if (searchDto.isSpecialProgram !== null && searchDto.isSpecialProgram !== undefined) {
      whereCondition.isSpecialProgram = searchDto.isSpecialProgram;
    }

    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.programRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['sequenceNumber', 'ASC']],
      offset: offset,
      limit: pageSize,
      nest: true,
    });
    const resList: IPublicProgram[] = rows.map((item: any) => this.convertToPublic(this.convertToModel(item)));
    return {
      tableData: resList,
      count: count,
    };
  }

  /**
   * Public method to fetch an active program by ID
   */
  public async fetchByIdPublic(id: number): Promise<IPublicProgram> {
    const find = await this.programRepository.scope('details').findOne({
      where: {
        programId: id,
        active: true,
      },
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Program not found');
    }
    return this.convertToPublic(this.convertToModel(find));
  }

  /**
   * Public method to fetch an active program by URL (slug)
   */
  public async fetchByUrlPublic(url: string): Promise<IPublicProgram> {
    const find = await this.programRepository.scope('details').findOne({
      where: {
        url: url,
        active: true,
      },
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Program not found');
    }
    return this.convertToPublic(this.convertToModel(find));
  }

  /**
   * Convert IProgram to IPublicProgram (exclude admin/internal fields)
   */
  private convertToPublic(program: IProgram): IPublicProgram {
    const { createdBy, modifiedBy, createdAt, updatedAt, createdByUser, updatedByUser, active, ...publicProgram } = program;
    return publicProgram as IPublicProgram;
  }
}
