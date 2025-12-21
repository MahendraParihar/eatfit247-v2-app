import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstProgram } from '../models';
import { ITableList, IBasicSearch, IProgram, IManageProgram, IDropdownItem, ConfigParam } from 'eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server/common';

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

  private parseTags(tags: any): string[] | null {
    if (!tags) {
      return null;
    }
    // If it's already an array, return it
    if (Array.isArray(tags)) {
      return tags;
    }
    // If it's a string, parse it
    if (typeof tags === 'string') {
      try {
        let cleaned = tags.trim();
        
        // First, try to decode JSON if it's a JSON-encoded string (e.g., "{\"tag1\",\"tag2\"}")
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          try {
            const decoded = JSON.parse(cleaned);
            cleaned = typeof decoded === 'string' ? decoded : String(decoded);
          } catch (e) {
            // Not valid JSON, continue with original
          }
        }
        
        // Handle PostgreSQL array format: {tag1,tag2} or {"tag1","tag2"}
        cleaned = cleaned.trim();
        
        // Remove outer braces if present
        if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
          cleaned = cleaned.slice(1, -1).trim();
        }
        
        // Extract quoted strings using regex to match "quoted" strings
        const quotedMatches = cleaned.match(/"([^"]*)"/g);
        if (quotedMatches && quotedMatches.length > 0) {
          return quotedMatches.map((match) => {
            // Remove quotes and handle escaped quotes
            return match.slice(1, -1).replace(/\\"/g, '"');
          });
        }
        
        // If no quotes, split by comma (handles unquoted values)
        if (cleaned) {
          const result = cleaned.split(',').map((item) => item.trim()).filter((item) => item);
          return result.length > 0 ? result : null;
        }
      } catch (error) {
        console.error('Error parsing tags array:', error, tags);
      }
    }
    return null;
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
        tags: this.parseTags(item.tags),
        url: item.url,
      },
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
}

