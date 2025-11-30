import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import moment from 'moment';
import { Sequelize } from 'sequelize-typescript';
import { MstProgramPlan } from '../../../core/database/models/mst-program-plan.model';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from '../../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch } from 'shared-lib';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import { CreatePlanDto } from '../dto/plan.dto';
import { IPlanFees, IProgramPlan } from 'shared-lib';
import { IDropdownItem } from 'shared-lib';
import { MstProgramPlanType } from '../../../core/database/models/mst-program-plan-type.model';
import { ICreateUpdate } from 'shared-lib';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class PlanService {
  constructor(
    @InjectModel(MstProgramPlan) private readonly programRepository: typeof MstProgramPlan,
    @InjectModel(MstProgramPlanType) private readonly programPlanTypeRepository: typeof MstProgramPlanType,
    private sequelize: Sequelize,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IProgramPlan>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'plan');

    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.programRepository.findAndCountAll<MstProgramPlan>({
      include: [
        {
          model: MstProgramPlanType,
          required: true,
          as: 'ProgramPlanType',
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
      order: [['sequenceNumber', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IProgramPlan[] = [];
    for (const s of rows) {
      resList.push(this.convertProgramPlanDBObject(s));
    }

    return <ITableList<IProgramPlan>>{
      data: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IProgramPlan> {
    const find = await this.findById(id);
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return this.convertProgramPlanDBObject(find);
  }

  public async findById(id: number): Promise<MstProgramPlan> {
    return await this.programRepository.findOne<MstProgramPlan>({
      include: [
        {
          model: MstProgramPlanType,
          required: true,
          as: 'ProgramPlanType',
        },
      ],
      where: {
        programPlanId: id,
      },
      raw: true,
      nest: true,
    });
  }

  public async create(obj: CreatePlanDto, cIp: string, adminId: number): Promise<void> {
    const t = await this.sequelize.transaction();

    try {
      const createObj = {
        plan: obj.title,
        details: obj.details,
        inrAmount: obj.inrAmount,
        noOfCycle: obj.noOfCycle,
        programPlanTypeId: obj.programPlanTypeId,
        isOnline: obj.isOnline,
        isVisibleOnWeb: obj.isVisibleOnWeb,
        noOfDaysInCycle: obj.noOfDaysInCycle,
        sequenceNumber: obj.sequenceNumber,
        tags: obj.tags,
        url: CommonFunctionsUtil.removeSpecialChar(obj.title.toString().toLowerCase(), '-'),
        active: obj.active,
        imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: cIp,
        modifiedIp: cIp,
      };
      await this.createInDB(createObj);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async update(id: number, obj: CreatePlanDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.programRepository.findOne({
      where: {
        programPlanId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }

    const t = await this.sequelize.transaction();

    try {
      const updateObj = {
        plan: obj.title,
        details: obj.details,
        inrAmount: obj.inrAmount,
        noOfCycle: obj.noOfCycle,
        programPlanTypeId: obj.programPlanTypeId,
        isOnline: obj.isOnline,
        isVisibleOnWeb: obj.isVisibleOnWeb,
        noOfDaysInCycle: obj.noOfDaysInCycle,
        sequenceNumber: obj.sequenceNumber,
        tags: obj.tags,
        url: CommonFunctionsUtil.removeSpecialChar(obj.title.toString().toLowerCase(), '-'),
        active: obj.active,
        imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
        modifiedBy: adminId,
        modifiedIp: cIp,
      };
      await this.updateInDB(id, updateObj);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.programRepository.findOne({
      where: {
        programPlanId: id,
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

  public async getProgramPlanTypeList(): Promise<IDropdownItem[]> {
    const tempList = await this.programPlanTypeRepository.findAll<MstProgramPlanType>({
      where: {
        active: true,
      },
      raw: true,
      order: [['programPlanType', 'ASC']],
    });
    const list: IDropdownItem[] = [];
    for (const t of tempList) {
      list.push({
        id: t.programPlanTypeId,
        label: t.programPlanType,
        selected: false,
      });
    }
    return list;
  }

  public async getProgramPlanList(): Promise<IPlanFees[]> {
    const tempList = await this.programRepository.findAll<MstProgramPlan>({
      where: {
        active: true,
      },
      order: [['noOfCycle', 'asc'], ['noOfDaysInCycle', 'asc'], ['inr_amount', 'asc']],
      raw: true,
    });
    const list: IPlanFees[] = [];
    for (const s of tempList) {
      list.push(<IPlanFees>{
        id: s.programPlanId,
        title: `${s.plan} (INR ${s.inrAmount} - ${s.isOnline ? 'OnLine' : 'Personal'})`,
        inrAmount: s.inrAmount,
        noOfCycle: s.noOfCycle,
        noOfDaysInCycle: s.noOfDaysInCycle,
        isOnline: s.isOnline,
      });
    }
    return list;
  }

  private async createInDB(obj: any) {
    return await this.programRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.programRepository.update(obj, { where: { programPlanId: id } });
  }

  private convertProgramPlanDBObject(obj: MstProgramPlan): IProgramPlan {
    return <IProgramPlan>(<ICreateUpdate>{
      id: obj.programPlanId,
      title: obj.plan,
      details: obj.details,
      inrAmount: obj.inrAmount,
      noOfCycle: obj.noOfCycle,
      programPlanTypeId: obj.programPlanTypeId,
      programPlanType: obj['ProgramPlanType']['programPlanType'],
      isOnline: obj.isOnline,
      isVisibleOnWeb: obj.isVisibleOnWeb,
      noOfDaysInCycle: obj.noOfDaysInCycle,
      sequenceNumber: obj.sequenceNumber,
      tags: obj.tags ? obj.tags.split(', ') : null,
      url: obj.url,
      active: obj.active,
      imagePath: CommonFunctionsUtil.getImagesObj(obj.imagePath),
      createdBy: CommonFunctionsUtil.getAdminShortInfo(obj['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(obj['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(obj.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(obj.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    });
  }
}
