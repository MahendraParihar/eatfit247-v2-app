import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from '../../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch } from 'shared-lib';
import { ILov } from 'shared-lib';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import moment from 'moment';
import { CreateLovDto } from '../dto/lov.dto';
import { MstRecipeCuisine } from '../../../core/database/models/mst-recipe-cuisine.model';
import { IDropdownItem } from 'shared-lib';
import { SearchUtil } from 'src/util/search-util';

@Injectable()
export class RecipeCuisineService {
  constructor(
    @InjectModel(MstRecipeCuisine) private readonly recipeCuisineRepository: typeof MstRecipeCuisine,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ILov>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'recipeCuisine');

    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.recipeCuisineRepository.findAndCountAll<MstRecipeCuisine>({
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
      order: [['recipeCuisine', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: ILov[] = [];
    for (const s of rows) {
      const iEvent: ILov = {
        id: s.recipeCuisineId,
        name: s.recipeCuisine,
        active: s.active,
        imagePath: CommonFunctionsUtil.getImagesObj(s.imagePath),
        createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      };
      resList.push(iEvent);
    }

    return <ITableList<ILov>>{
      data: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<ILov> {
    const find = await this.recipeCuisineRepository.findOne({
      where: {
        recipeCuisineId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return <ILov>{
      id: find.recipeCuisineId,
      name: find.recipeCuisine,
      active: find.active,
      imagePath: CommonFunctionsUtil.getImagesObj(find.imagePath),
      createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    };
  }

  public async create(obj: CreateLovDto, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      recipeCuisine: obj.name,
      imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.createInDB(createObj);
  }

  public async update(id: number, obj: CreateLovDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.recipeCuisineRepository.findOne({
      where: {
        recipeCuisineId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      recipeCuisine: obj.name,
      imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
      active: obj.active != null ? obj.active : find.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.recipeCuisineRepository.findOne({
      where: {
        recipeCuisineId: id,
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

  public async getRecipeCuisineList(): Promise<IDropdownItem[]> {
    const tempList = await this.recipeCuisineRepository.findAll<MstRecipeCuisine>({
      where: {
        active: true,
      },
      order: [['recipeCuisine', 'ASC']],
    });
    const list: IDropdownItem[] = [];
    for (const t of tempList) {
      list.push({
        id: t.recipeCuisineId,
        label: t.recipeCuisine,
        selected: false,
      });
    }
    return list;
  }

  private async createInDB(obj: any) {
    return await this.recipeCuisineRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.recipeCuisineRepository.update(obj, { where: { recipeCuisineId: id } });
  }
}
