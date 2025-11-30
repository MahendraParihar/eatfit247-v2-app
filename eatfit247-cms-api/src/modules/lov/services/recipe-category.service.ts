import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  DEFAULT_DATE_TIME_FORMAT,
  DEFAULT_TIME_FORMAT,
  DISPLAY_TIME_FORMAT,
} from '../../../constants/config-constants';
import { StringResource, ITableList, IBasicSearch } from 'shared-lib';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import moment from 'moment';
import { MstRecipeCategory } from '../../../core/database/models/mst-recipe-category.model';
import { CreateRecipeCategoryDto } from '../dto/recipe-category.dto';
import { IRecipeCategory } from 'shared-lib';
import { IDropdownItem } from 'shared-lib';

@Injectable()
export class RecipeCategoryService {
  constructor(
    @InjectModel(MstRecipeCategory) private readonly recipeCategoryRepository: typeof MstRecipeCategory,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IRecipeCategory>> {
    const rows = await this.fetchAllRecipeCategory();

    const resList: IRecipeCategory[] = [];
    for (const s of rows) {
      const iEvent: IRecipeCategory = {
        id: s.recipeCategoryId,
        name: s.recipeCategory,
        sequence: s.sequence,
        fromTime: moment(s.fromTime, DEFAULT_TIME_FORMAT).format(DISPLAY_TIME_FORMAT),
        toTime: moment(s.toTime, DEFAULT_TIME_FORMAT).format(DISPLAY_TIME_FORMAT),
        active: s.active,
        imagePath: CommonFunctionsUtil.getImagesObj(s.imagePath),
        createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
        updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
        createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
        updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
      };
      resList.push(iEvent);
    }

    return <ITableList<IRecipeCategory>>{
      data: resList,
      count: rows.length,
    };
  }

  public async fetchAllRecipeCategory() {
    return await this.recipeCategoryRepository.findAll<MstRecipeCategory>({
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
      order: [['sequence', 'ASC']],
      raw: true,
      nest: true,
    });
  }

  public async fetchById(id: number): Promise<IRecipeCategory> {
    const find = await this.recipeCategoryRepository.findOne({
      where: {
        recipeCategoryId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    return <IRecipeCategory>{
      id: find.recipeCategoryId,
      name: find.recipeCategory,
      sequence: find.sequence,
      fromTime: moment(find.fromTime, DEFAULT_TIME_FORMAT).format(DISPLAY_TIME_FORMAT),
      toTime: moment(find.toTime, DEFAULT_TIME_FORMAT).format(DISPLAY_TIME_FORMAT),
      active: find.active,
      imagePath: CommonFunctionsUtil.getImagesObj(find.imagePath),
      createdBy: CommonFunctionsUtil.getAdminShortInfo(find['CreatedBy'], 'CreatedBy'),
      updatedBy: CommonFunctionsUtil.getAdminShortInfo(find['ModifiedBy'], 'ModifiedBy'),
      createdAt: moment(find.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
      updatedAt: moment(find.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
    };
  }

  public async create(obj: CreateRecipeCategoryDto, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      recipeCategory: obj.name,
      sequence: obj.sequence,
      fromTime: obj.fromTime,
      toTime: obj.toTime,
      imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.createInDB(createObj);
  }

  public async update(
    id: number,
    obj: CreateRecipeCategoryDto,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const find = await this.recipeCategoryRepository.findOne({
      where: {
        recipeCategoryId: id,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      recipeCategory: obj.name,
      sequence: obj.sequence,
      fromTime: obj.fromTime,
      toTime: obj.toTime,
      imagePath: obj.uploadFiles && obj.uploadFiles.length > 0 ? obj.uploadFiles : null,
      active: obj.active != null ? obj.active : find.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.updateInDB(id, updateObj);
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<void> {
    const find = await this.recipeCategoryRepository.findOne({
      where: {
        recipeCategoryId: id,
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

  public async getRecipeCategoryList(): Promise<IDropdownItem[]> {
    const tempList = await this.recipeCategoryRepository.findAll<MstRecipeCategory>({
      where: {
        active: true,
      },
      order: [['recipeCategory', 'ASC']],
    });
    const list: IDropdownItem[] = [];
    for (const t of tempList) {
      list.push({
        id: t.recipeCategoryId,
        label: t.recipeCategory,
        selected: false,
      });
    }
    return list;
  }

  private async createInDB(obj: any) {
    return await this.recipeCategoryRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.recipeCategoryRepository.update(obj, { where: { recipeCategoryId: id } });
  }
}
