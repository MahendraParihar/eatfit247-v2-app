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
import { MstRecipeType } from '../../../core/database/models/mst-recipe-type.model';
import { IDropdownItem } from 'shared-lib';

@Injectable()
export class RecipeTypeService {
  constructor(
    @InjectModel(MstRecipeType) private readonly recipeTypeRepository: typeof MstRecipeType,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ILov>> {
    const whereCondition: any = {};
    if (searchDto.name) {
      whereCondition['recipeType'] = searchDto.name;
    }
    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.recipeTypeRepository.findAndCountAll<MstRecipeType>({
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
      order: [['recipeType', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: ILov[] = [];
    for (const s of rows) {
      const iEvent: ILov = {
        id: s.recipeTypeId,
        name: s.recipeType,
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
      tableData: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<ILov> {
    const find = await this.recipeTypeRepository.findOne({
      where: {
        recipeTypeId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return <ILov>{
      id: find.recipeTypeId,
      name: find.recipeType,
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
      recipeType: obj.name,
      imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.createInDB(createObj);
  }

  public async update(id: number, obj: CreateLovDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.recipeTypeRepository.findOne({
      where: {
        recipeTypeId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      recipeType: obj.name,
      imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
      active: obj.active != null ? obj.active : find.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.recipeTypeRepository.findOne({
      where: {
        recipeTypeId: id,
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

  public async getRecipeTypeList(): Promise<IDropdownItem[]> {
    const tempList = await this.recipeTypeRepository.findAll<MstRecipeType>({
      where: {
        active: true,
      },
      order: [['recipeType', 'ASC']],
    });
    const list: IDropdownItem[] = [];
    for (const t of tempList) {
      list.push({
        id: t.recipeTypeId,
        label: t.recipeType,
        selected: false,
      });
    }
    return list;
  }

  private async createInDB(obj: any) {
    return await this.recipeTypeRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.recipeTypeRepository.update(obj, { where: { recipeTypeId: id } });
  }
}
