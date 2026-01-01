import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstCallPurpose } from '@server/common';
import { ITableList, IBasicSearch, ICallPurpose, IManageCallPurpose, IDropdownItem, ConfigParam } from '@eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, AppConfigService } from '@server/common';

@Injectable()
export class CallPurposeService {
  constructor(
    @InjectModel(MstCallPurpose) private readonly callPurposeRepository: typeof MstCallPurpose,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ICallPurpose>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'callPurpose');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.callPurposeRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['callPurpose', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: ICallPurpose[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): ICallPurpose {
    return <ICallPurpose>{
      callPurposeId: item.callPurposeId,
      id: item.callPurposeId,
      callPurpose: item.callPurpose,
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

  public async fetchById(id: number): Promise<ICallPurpose> {
    const find = await this.callPurposeRepository.scope('details').findOne({
      where: { callPurposeId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Call purpose not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageCallPurpose, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      callPurpose: obj.callPurpose,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.callPurposeRepository.create(createObj);
  }

  public async update(id: number, obj: IManageCallPurpose, cIp: string, adminId: number): Promise<void> {
    const find = await this.callPurposeRepository.findOne({
      where: { callPurposeId: id },
    });
    if (!find) {
      throw new NotFoundException('Call purpose not found');
    }
    const updateObj = {
      callPurpose: obj.callPurpose,
      imagePath: (obj.imagePath && obj.imagePath.length > 0) ? obj.imagePath : null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.callPurposeRepository.update(updateObj, { where: { callPurposeId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.callPurposeRepository.findOne({
      where: { callPurposeId: id },
    });
    if (!find) {
      throw new NotFoundException('Call purpose not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.callPurposeRepository.update(updateObj, { where: { callPurposeId: id } });
  }

  public async getCallPurposeList(): Promise<IDropdownItem[]> {
    const tempList = await this.callPurposeRepository.findAll<MstCallPurpose>({
      where: { active: true },
      order: [['callPurpose', 'ASC']],
    });
    return tempList.map((t) => ({
      id: t.callPurposeId,
      label: t.callPurpose,
      selected: false,
    }));
  }
}

