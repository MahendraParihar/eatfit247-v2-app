import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  ConfigParam,
  IBasicSearch,
  IDropdownItem,
  IFranchise,
  IManageAddress,
  IManageFranchise,
  ITableList,
  TableEnum,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, MstFranchise, SearchUtil } from '@server_1/core';
import { AddressService } from '@server_1/platform';

@Injectable()
export class FranchiseService {
  constructor(
    @InjectModel(MstFranchise) private readonly franchiseRepository: typeof MstFranchise,
    private appConfigService: AppConfigService,
    private addressService: AddressService,
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
    const resList: IFranchise[] = await Promise.all(rows.map((item: any) => this.convertToModel(item)));
    return {
      tableData: resList,
      count: count,
    };
  }

  private async convertToModel(item: any): Promise<IFranchise> {
    // Fetch address for this franchise
    const address = await this.addressService.findByTableIdAndPk(
      TableEnum.MST_FRANCHISES,
      item.franchiseId,
    );
    
    return <IFranchise>{
      franchiseId: item.franchiseId,
      id: item.franchiseId,
      companyName: item.companyName,
      logo: CommonFunctionsUtil.buildImageUrl(
        item.logo
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
      vatNumber: item.vatNumber,
      bankAccountId: item.bankAccountId,
      paymentGatewayConfigId: item.paymentGatewayConfigId,
      brandName: item.brandName,
      lutNumber: item.lutNumber,
      internationalTaxMode: item.internationalTaxMode,
      startDate: item.startDate,
      endDate: item.endDate,
      isPrimary: item.isPrimary,
      isDefault: item.isDefault,
      businessType: item.businessType,
      active: item.active,
      addressObj: address || undefined,
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
    return await this.convertToModel(find);
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
      vatNumber: obj.vatNumber || null,
      bankAccountId: obj.bankAccountId || null,
      paymentGatewayConfigId: obj.paymentGatewayConfigId || null,
      brandName: obj.brandName || null,
      lutNumber: obj.lutNumber || null,
      internationalTaxMode: (obj.internationalTaxMode as 'EXPORT_OF_SERVICE' | 'LOCAL_FOREIGN_TAX' | null) || null,
      startDate: obj.startDate,
      endDate: obj.endDate || null,
      isPrimary: obj.isPrimary,
      businessType: obj.businessType || null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    const franchise = await this.franchiseRepository.create(createObj);
    
    // Handle address creation if provided
    if (obj.address) {
      const addressData: IManageAddress = {
        ...obj.address,
        tableId: TableEnum.MST_FRANCHISES,
        pkOfTable: franchise.franchiseId,
      };
      await this.addressService.createOrUpdate(addressData, cIp, adminId);
    }
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
      vatNumber: obj.vatNumber || null,
      bankAccountId: obj.bankAccountId || null,
      paymentGatewayConfigId: obj.paymentGatewayConfigId || null,
      brandName: obj.brandName || null,
      lutNumber: obj.lutNumber || null,
      internationalTaxMode: (obj.internationalTaxMode as 'EXPORT_OF_SERVICE' | 'LOCAL_FOREIGN_TAX' | null) || null,
      startDate: obj.startDate,
      endDate: obj.endDate || null,
      isPrimary: obj.isPrimary,
      isDefault: obj.isDefault,
      businessType: obj.businessType || null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    await this.franchiseRepository.update(updateObj, { where: { franchiseId: id } });
    
    // Handle address creation/update if provided
    if (obj.address) {
      const addressData: IManageAddress = {
        ...obj.address,
        tableId: TableEnum.MST_FRANCHISES,
        pkOfTable: id,
      };
      await this.addressService.createOrUpdate(addressData, cIp, adminId);
    }
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

  /**
   * Get franchise list with country information for checkout
   * Returns franchises with their countryId from address and isDefault flag
   */
  public async getFranchiseListWithCountry(): Promise<
    Array<{ id: number; label: string; countryId: number | null; isDefault: boolean }>
  > {
    const tempList = await this.franchiseRepository.scope('list').findAll({
      where: { active: true },
      order: [['companyName', 'ASC']],
      raw: true,
      nest: true,
    });

    const franchisesWithCountry = await Promise.all(
      tempList.map(async (t: any) => {
        // Get franchise address to find country
        const addresses = await this.addressService.filterByTableIdAndPk(
          TableEnum.MST_FRANCHISES,
          t.franchiseId,
        );
        const countryId = addresses && addresses.length > 0 ? addresses[0].countryId : null;

        return {
          id: t.franchiseId,
          label: t.companyName,
          countryId: countryId,
          isDefault: t.isDefault,
        };
      }),
    );

    return franchisesWithCountry;
  }

  public async getMasterData(): Promise<{ taxApplicable: boolean }> {
    const taxApplicable = this.appConfigService.getBoolean(ConfigParam.GST_ENABLED, true, false);
    return { taxApplicable };
  }
}

