import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstTypeOfExercise } from '@server/common';
import { ITableList, IBasicSearch, ITypeOfExercise, IManageTypeOfExercise, IDropdownItem, ConfigParam } from '@eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server/common';

@Injectable()
export class TypeOfExerciseService {
  constructor(
    @InjectModel(MstTypeOfExercise) private readonly typeOfExerciseRepository: typeof MstTypeOfExercise,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ITypeOfExercise>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'typeOfExercise');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.typeOfExerciseRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['typeOfExercise', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: ITypeOfExercise[] = rows.map((item: any) => {return this.convertToModel(item);});
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): ITypeOfExercise {
    return <ITypeOfExercise>{
      typeOfExerciseId: item.typeOfExerciseId,
      id: item.typeOfExerciseId,
      typeOfExercise: item.typeOfExercise,
      imagePath: CommonFunctionsUtil.buildImageUrl(
        item.imagePath,
        this.appConfigService.getString(ConfigParam.CLIENT_URL),
      ),
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
    };
  }

  public async fetchById(id: number): Promise<ITypeOfExercise> {
    const find = await this.typeOfExerciseRepository.scope('details').findOne({
      where: { typeOfExerciseId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Type of exercise not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageTypeOfExercise, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      typeOfExercise: obj.typeOfExercise,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.typeOfExerciseRepository.create(createObj);
  }

  public async update(id: number, obj: IManageTypeOfExercise, cIp: string, adminId: number): Promise<void> {
    const find = await this.typeOfExerciseRepository.findOne({ where: { typeOfExerciseId: id } });
    if (!find) {
      throw new NotFoundException('Type of exercise not found');
    }
    const updateObj = {
      typeOfExercise: obj.typeOfExercise,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.typeOfExerciseRepository.update(updateObj, { where: { typeOfExerciseId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.typeOfExerciseRepository.findOne({ where: { typeOfExerciseId: id } });
    if (!find) {
      throw new NotFoundException('Type of exercise not found');
    }
    await this.typeOfExerciseRepository.update({ active, modifiedBy: adminId, modifiedIp: cIp }, { where: { typeOfExerciseId: id } });
  }

  public async getTypeOfExerciseList(): Promise<IDropdownItem[]> {
    const tempList = await this.typeOfExerciseRepository.findAll<MstTypeOfExercise>({
      where: { active: true },
      order: [['typeOfExercise', 'ASC']],
    });
    return tempList.map((t) => ({ id: t.typeOfExerciseId, label: t.typeOfExercise, selected: false }));
  }
}

