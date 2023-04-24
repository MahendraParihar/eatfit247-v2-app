import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../../common/exception.service';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { IServerResponse } from '../../../common-dto/response-interface';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  DEFAULT_DATE_TIME_FORMAT,
  DEFAULT_TIME_FORMAT,
  DISPLAY_TIME_FORMAT,
  IS_DEV,
} from '../../../constants/config-constants';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import * as moment from 'moment/moment';
import { MstRecipeCategory } from '../../../core/database/models/mst-recipe-category.model';
import { CreateRecipeCategoryDto } from '../dto/recipe-category.dto';
import { IRecipeCategory } from '../../../response-interface/recipe-category.interface';
import { DropdownListInterface } from '../../../response-interface/dropdown-list.interface';

@Injectable()
export class RecipeCategoryService {
  constructor(
    @InjectModel(MstRecipeCategory) private readonly recipeCategoryRepository: typeof MstRecipeCategory,
    private exceptionService: ExceptionService,
  ) {}

  public async findAll(searchDto: BasicSearchDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const rows = await this.fetchAllRecipeCategory();
      if (!rows || rows.length === 0) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
        return res;
      }

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

      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: {
          list: resList,
          count: rows.length,
        },
      };

      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
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

  public async fetchById(id: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.recipeCategoryRepository.findOne({
        where: {
          recipeCategoryId: id,
        },
      });
      if (find) {
        const dataObj = <IRecipeCategory>{
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

        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS,
          data: dataObj,
        };
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async create(obj: CreateRecipeCategoryDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
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
      const createdObj = await this.createInDB(createObj);
      if (createdObj) {
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS_DATA_UPDATE,
          data: null,
        };
      } else {
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.SOMETHING_WENT_WRONG,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async update(
    id: number,
    obj: CreateRecipeCategoryDto,
    cIp: string,
    adminId: number,
  ): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.recipeCategoryRepository.findOne({
        where: {
          recipeCategoryId: id,
        },
      });
      if (find) {
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
        const updatedObj = await this.updateInDB(id, updateObj);
        if (updatedObj) {
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_UPDATE,
            data: null,
          };
        } else {
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null,
          };
        }
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async changeStatus(id: number, obj: UpdateActiveDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.recipeCategoryRepository.findOne({
        where: {
          recipeCategoryId: id,
        },
      });
      if (find) {
        const updateObj = {
          active: obj.active,
          modifiedBy: adminId,
          modifiedIp: cIp,
        };
        const updatedObj = await this.updateInDB(id, updateObj);
        if (updatedObj) {
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_STATUS_CHANGE,
            data: null,
          };
        } else {
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null,
          };
        }
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
      return res;
    } catch (e) {
      this.exceptionService.logException(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async getRecipeCategoryList(): Promise<DropdownListInterface[]> {
    const tempList = await this.recipeCategoryRepository.findAll<MstRecipeCategory>({
      where: {
        active: true,
      },
      order: [['recipeCategory', 'ASC']],
    });
    const list: DropdownListInterface[] = [];
    for (const t of tempList) {
      list.push({
        id: t.recipeCategoryId,
        name: t.recipeCategory,
        selected: false,
      });
    }
    return list;
  }

  private async createInDB(obj: any) {
    return await this.recipeCategoryRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.recipeCategoryRepository
      .update(obj, { where: { recipeCategoryId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }
}
