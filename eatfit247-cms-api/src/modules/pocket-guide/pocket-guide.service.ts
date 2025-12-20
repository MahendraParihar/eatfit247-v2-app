import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BasicSearchDto, UpdateActiveDto } from '../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from '../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch, IManagePocketGuide } from 'shared-lib';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import moment from 'moment';
import { CreatePocketGuideDto } from './dto/pocket-guide.dto';
import { MstPocketGuide } from '../../core/database/models/mst-pocket-guide.model';
import { IPocketGuide } from 'shared-lib';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class PocketGuideService {
  constructor(@InjectModel(MstPocketGuide) private readonly pocketGuideRepository: typeof MstPocketGuide) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IPocketGuide>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'pocketGuide');

    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.pocketGuideRepository.findAndCountAll<MstPocketGuide>({
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
      order: [['pocketGuide', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IPocketGuide[] = [];
    for (const s of rows) {
      const iEvent: IPocketGuide = {
        id: s.pocketGuideId,
        name: s.pocketGuide,
        description: s.description,
        active: s.active,
        imagePath: CommonFunctionsUtil.getImagesObj(s.imagePath),
        filePath: CommonFunctionsUtil.getImagesObj(s.filePath),
        createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      };
      resList.push(iEvent);
    }

    return <ITableList<IPocketGuide>>{
      tableData: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<IPocketGuide> {
    const find = await this.pocketGuideRepository.findOne({
      where: {
        pocketGuideId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return <IPocketGuide>{
      id: find.pocketGuideId,
      name: find.pocketGuide,
      description: find.description,
      active: find.active,
      imagePath: CommonFunctionsUtil.getImagesObj(find.imagePath),
      filePath: CommonFunctionsUtil.getImagesObj(find.filePath),
      createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    };
  }

  public async create(obj: IManagePocketGuide, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      pocketGuide: obj.name,
      description: obj.description,
      imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
      filePath: obj.uploadAttachment && obj.uploadAttachment.length > 0 ? obj.uploadAttachment : null,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.createInDB(createObj);
  }

  public async update(id: number, obj: IManagePocketGuide, cIp: string, adminId: number): Promise<void> {
    const find = await this.pocketGuideRepository.findOne({
      where: {
        pocketGuideId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      pocketGuide: obj.name,
      description: obj.description,
      imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
      filePath: obj.uploadAttachment && obj.uploadAttachment.length > 0 ? obj.uploadAttachment : null,
      active: obj.active != null ? obj.active : find.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.pocketGuideRepository.findOne({
      where: {
        pocketGuideId: id,
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

  private async createInDB(obj: any) {
    return await this.pocketGuideRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.pocketGuideRepository.update(obj, { where: { pocketGuideId: id } });
  }
}
