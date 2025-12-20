import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  ITableList,
  IBasicSearch,
  IFranchise,
  IManageFranchise,
  IDropdownItem,
  ConfigParam,
} from 'eatfit247-shared-lib';
import { SearchUtil, CommonFunctionsUtil, MstFranchise, AppConfigService } from '@server/common';

@Injectable()
export class FranchiseService {
  constructor(
    @InjectModel(MstFranchise) private readonly franchiseRepository: typeof MstFranchise,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<IFranchise>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'companyName');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;
    const { rows, count } = await this.franchiseRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['companyName', 'ASC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });
    const resList: IFranchise[] = rows.map((item: any) => {return this.convertToModel(item);});
    return {
      tableData: resList,
      count: count,
    };
  }

  private convertToModel(item: any): IFranchise {
    return <IFranchise>{
      franchiseId: item.franchiseId,
      id: item.franchiseId,
      companyName: item.companyName,
      logo: CommonFunctionsUtil.buildImageUrl(
        item.logo,
        this.appConfigService.getString(ConfigParam.CLIENT_URL),
      ),
      firstName: item.firstName,
      lastName: item.lastName,
      emailId: item.emailId,
      alternateEmailId: item.alternateEmailId,
      contactNumber: item.contactNumber,
      alternateContactNumber: item.alternateContactNumber,
      panNumber: item.panNumber,
      tanNumber: item.tanNumber,
      gstNumber: item.gstNumber,
      startDate: item.startDate,
      endDate: item.endDate,
      isPrimary: item.isPrimary,
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

  public async fetchById(id: number): Promise<IFranchise> {
    const find = await this.franchiseRepository.scope('details').findOne({
      where: { franchiseId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Franchise not found');
    }
    return this.convertToModel(find);
  }

  public async create(obj: IManageFranchise, cIp: string, adminId: number): Promise<void> {
    const createObj = {
      companyName: obj.companyName,
      logo: (obj.logo && obj.logo.length > 0) ? obj.logo : null,
      firstName: obj.firstName,
      lastName: obj.lastName,
      emailId: obj.emailId,
      alternateEmailId: obj.alternateEmailId,
      contactNumber: obj.contactNumber,
      alternateContactNumber: obj.alternateContactNumber,
      panNumber: obj.panNumber,
      tanNumber: obj.tanNumber,
      gstNumber: obj.gstNumber,
      startDate: obj.startDate,
      endDate: obj.endDate || null,
      isPrimary: obj.isPrimary,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.franchiseRepository.create(createObj);
  }

  public async update(id: number, obj: IManageFranchise, cIp: string, adminId: number): Promise<void> {
    const find = await this.franchiseRepository.findOne({
      where: { franchiseId: id },
    });
    if (!find) {
      throw new NotFoundException('Franchise not found');
    }
    const updateObj = {
      companyName: obj.companyName,
      logo: (obj.logo && obj.logo.length > 0) ? obj.logo : null,
      firstName: obj.firstName,
      lastName: obj.lastName,
      emailId: obj.emailId,
      alternateEmailId: obj.alternateEmailId,
      contactNumber: obj.contactNumber,
      alternateContactNumber: obj.alternateContactNumber,
      panNumber: obj.panNumber,
      tanNumber: obj.tanNumber,
      gstNumber: obj.gstNumber,
      startDate: obj.startDate,
      endDate: obj.endDate || null,
      isPrimary: obj.isPrimary,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.franchiseRepository.update(updateObj, { where: { franchiseId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.franchiseRepository.findOne({
      where: { franchiseId: id },
    });
    if (!find) {
      throw new NotFoundException('Franchise not found');
    }
    const updateObj = {
      active: active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.franchiseRepository.update(updateObj, { where: { franchiseId: id } });
  }

  public async getFranchiseList(): Promise<IDropdownItem[]> {
    const tempList = await this.franchiseRepository.scope('list').findAll({
      where: { active: true },
      order: [['companyName', 'ASC']],
      raw: true,
      nest: true,
    });
    return tempList.map((t: any) => ({
      id: t.franchiseId,
      label: t.companyName,
      isActive: t.active,
    }));
  }
}

