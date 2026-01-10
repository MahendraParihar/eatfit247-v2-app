import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstProgram } from '../models';
import { ConfigParam, IBasicSearch, IDropdownItem, IManageProgram, IProgram, ITableList, IPublicProgram, IPublicTableList } from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil } from '@server_1/core';

@Injectable()
export class ProgramService {
  constructor(
    @InjectModel(MstProgram) private readonly programRepository: typeof MstProgram,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IProgram>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'program');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.programRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [
        ['programCategoryId', 'ASC'],
        ['sequenceNumber', 'ASC'],
      ],
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

  private convertToModel(item: any): IProgram {
    return <IProgram>{
      programId: item.programId,
      id: item.programId,
      program: item.program,
      programCategoryId: item.programCategoryId,
      programCategory: item.programCategory?.programCategory || '',
      punchLine: item.punchLine,
      details: item.details,
      idealFor: item.idealFor,
      sequenceNumber: item.sequenceNumber,
      isSpecialProgram: item.isSpecialProgram,
      videoUrl: item.videoUrl,
      seo: {
        metaTitle: item.metaTitle,
        metaDescription: item.metaDescription,
        tags: item.tags,
        url: item.url,
      },
      imagePath: CommonFunctionsUtil.buildImageUrl(item.imagePath),
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

  public async fetchById(id: number): Promise<IProgram> {
    const find = await this.programRepository.scope('details').findOne({
      where: { programId: id },
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Program not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageProgram, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      program: obj.program,
      programCategoryId: obj.programCategoryId,
      punchLine: obj.punchLine,
      details: obj.details,
      idealFor: obj.idealFor,
      sequenceNumber: obj.sequenceNumber,
      isSpecialProgram: obj.isSpecialProgram,
      videoUrl: obj.videoUrl,
      url: obj.seo ? obj.seo.url : CommonFunctionsUtil.removeSpecialChar(obj.program.toString().toLowerCase(), '-'),
      tags: obj.seo ? obj.seo.tags : null,
      metaTitle: obj.seo ? obj.seo.metaTitle : null,
      metaDescription: obj.seo ? obj.seo.metaDescription : null,
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
    const updateObj = {
      program: obj.program,
      programCategoryId: obj.programCategoryId,
      punchLine: obj.punchLine,
      details: obj.details,
      idealFor: obj.idealFor,
      sequenceNumber: obj.sequenceNumber,
      isSpecialProgram: obj.isSpecialProgram,
      videoUrl: obj.videoUrl,
      url: obj.seo
        ? obj.seo.url
        : CommonFunctionsUtil.removeSpecialChar(obj.program.toString().toLowerCase(), '-'),
      tags: obj.seo ? obj.seo.tags : null,
      metaTitle: obj.seo ? obj.seo.metaTitle : null,
      metaDescription: obj.seo ? obj.seo.metaDescription : null,
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
    
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.programRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [
        ['programCategoryId', 'ASC'],
        ['sequenceNumber', 'ASC'],
      ],
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
    const { createdBy, updatedBy, createdAt, updatedAt, createdByUser, updatedByUser, active, ...publicProgram } = program;
    return publicProgram as IPublicProgram;
  }
}

