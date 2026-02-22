import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnCourierProviderAccount, MstCourierProvider } from '../models';
import {
  IBasicSearch,
  ICourierProviderAccount,
  IDropdownItem,
  IManageCourierProviderAccount,
  ITableList,
} from '@eatfit247-shared-lib';
import { AppConfigService, CommonFunctionsUtil, SearchUtil, CryptoUtil } from '@server_1/core';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CourierProviderAccountService {
  constructor(
    @InjectModel(TxnCourierProviderAccount) private readonly courierProviderAccountRepository: typeof TxnCourierProviderAccount,
    private appConfigService: AppConfigService,
  ) {}

  public async findAll(searchDto: IBasicSearch): Promise<ITableList<ICourierProviderAccount>> {
    const whereCondition: any = SearchUtil.filterBasicSearch(searchDto, 'accountName');
    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.courierProviderAccountRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [['providerAccountId', 'DESC']],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: ICourierProviderAccount[] = rows.map((item: any) => this.convertToModel(item));
    return { tableData: resList, count: count };
  }

  private convertToModel(item: any): ICourierProviderAccount {
    return <ICourierProviderAccount>{
      providerAccountId: item.providerAccountId,
      providerId: item.providerId,
      franchiseId: item.franchiseId,
      accountName: item.accountName,
      apiBaseUrl: item.apiBaseUrl,
      // Don't expose sensitive fields in list view
      apiKey: undefined,
      apiSecret: undefined,
      username: undefined,
      passwordEncrypted: undefined,
      authToken: undefined,
      tokenExpiry: item.tokenExpiry,
      webhookSecret: undefined,
      active: item.active,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser') : undefined,
      updatedByUser: item.updatedByUser ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser') : undefined,
      provider: item.provider ? {
        providerId: item.provider.providerId,
        providerCode: item.provider.providerCode,
        providerName: item.provider.providerName,
      } : undefined,
      franchise: item.franchise ? {
        franchiseId: item.franchise.franchiseId,
        companyName: item.franchise.companyName,
      } : undefined,
    };
  }

  private convertToModelWithSensitive(item: any): ICourierProviderAccount {
    const model = this.convertToModel(item);
    // Include sensitive fields for detail view (but still don't expose password)
    return {
      ...model,
      apiKey: item.apiKey,
      apiSecret: item.apiSecret,
      username: item.username,
      authToken: item.authToken,
      webhookSecret: item.webhookSecret,
    };
  }

  public async fetchById(id: number): Promise<ICourierProviderAccount> {
    const find = await this.courierProviderAccountRepository.scope('details').findOne({
      where: { providerAccountId: id },
      raw: true,
      nest: true,
    });
    if (!find) {
      throw new NotFoundException('Courier provider account not found');
    }
    return this.convertToModelWithSensitive(find);
  }

  public async create(obj: IManageCourierProviderAccount, cIp: string, adminId: number): Promise<void> {
    let passwordEncrypted: string | null = null;
    if (obj.password) {
      // Fetch provider to determine auth type
      const provider = await MstCourierProvider.findOne({
        where: { providerId: obj.providerId },
      });
      
      // For JWT providers, use encryption (reversible) instead of bcrypt (one-way hash)
      // This allows password to be decrypted for token refresh API calls
      if (provider?.authType === 'JWT') {
        passwordEncrypted = CryptoUtil.encryptData(obj.password);
      } else {
        // For other auth types, use bcrypt hash
        passwordEncrypted = await bcrypt.hash(obj.password, 10);
      }
    }

    const createObj = {
      providerId: obj.providerId,
      franchiseId: obj.franchiseId,
      accountName: obj.accountName || null,
      apiBaseUrl: obj.apiBaseUrl,
      apiKey: obj.apiKey || null,
      apiSecret: obj.apiSecret || null,
      username: obj.username || null,
      passwordEncrypted: passwordEncrypted,
      authToken: obj.authToken || null,
      tokenExpiry: obj.tokenExpiry || null,
      webhookSecret: obj.webhookSecret || null,
      active: obj.active,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: cIp,
      modifiedIp: cIp,
    };
    await this.courierProviderAccountRepository.create(createObj);
  }

  public async update(id: number, obj: IManageCourierProviderAccount, cIp: string, adminId: number): Promise<void> {
    const find = await this.courierProviderAccountRepository.findOne({ where: { providerAccountId: id } });
    if (!find) {
      throw new NotFoundException('Courier provider account not found');
    }

    const updateObj: any = {
      providerId: obj.providerId,
      franchiseId: obj.franchiseId,
      accountName: obj.accountName || null,
      apiBaseUrl: obj.apiBaseUrl,
      apiKey: obj.apiKey || null,
      apiSecret: obj.apiSecret || null,
      username: obj.username || null,
      authToken: obj.authToken || null,
      tokenExpiry: obj.tokenExpiry || null,
      webhookSecret: obj.webhookSecret || null,
      active: obj.active,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };

    // Only update password if provided
    if (obj.password) {
      // Fetch provider to determine auth type
      const provider = await MstCourierProvider.findOne({
        where: { providerId: obj.providerId },
      });
      
      // For JWT providers, use encryption (reversible) instead of bcrypt (one-way hash)
      // This allows password to be decrypted for token refresh API calls
      if (provider?.authType === 'JWT') {
        updateObj.passwordEncrypted = CryptoUtil.encryptData(obj.password);
      } else {
        // For other auth types, use bcrypt hash
        updateObj.passwordEncrypted = await bcrypt.hash(obj.password, 10);
      }
    }

    await this.courierProviderAccountRepository.update(updateObj, { where: { providerAccountId: id } });
  }

  public async changeStatus(id: number, active: boolean, cIp: string, adminId: number): Promise<void> {
    const find = await this.courierProviderAccountRepository.findOne({ where: { providerAccountId: id } });
    if (!find) {
      throw new NotFoundException('Courier provider account not found');
    }
    await this.courierProviderAccountRepository.update({ active, modifiedBy: adminId, modifiedIp: cIp }, { where: { providerAccountId: id } });
  }

  /**
   * Update auth token and expiry for a provider account
   * Used after token refresh to persist new token
   */
  public async updateToken(
    id: number,
    authToken: string,
    tokenExpiry?: Date,
  ): Promise<void> {
    const find = await this.courierProviderAccountRepository.findOne({ where: { providerAccountId: id } });
    if (!find) {
      throw new NotFoundException('Courier provider account not found');
    }
    await this.courierProviderAccountRepository.update(
      { 
        authToken,
        tokenExpiry: tokenExpiry || null,
        // Note: modifiedBy and modifiedIp are not updated for automatic token refreshes
        // This is intentional to avoid polluting audit trail with system updates
      },
      { where: { providerAccountId: id } },
    );
  }

  public async getCourierProviderAccountList(): Promise<IDropdownItem[]> {
    const tempList = await this.courierProviderAccountRepository.findAll<TxnCourierProviderAccount>({
      where: { active: true },
      include: [
        {
          model: MstCourierProvider,
          as: 'provider',
          attributes: ['providerId', 'providerCode', 'providerName'],
        },
      ],
      order: [['providerAccountId', 'DESC']],
    });
    return tempList.map((t) => ({ 
      id: t.providerAccountId, 
      label: t.accountName || `${t.provider?.providerName || 'Unknown'} - Account ${t.providerAccountId}`, 
      selected: false 
    }));
  }
}

