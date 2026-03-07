import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  MstCourierProvider,
  MstWarehouse,
  TxnCourierProviderAccount,
  TxnCourierProviderWarehouse,
  TxnShipment,
} from '../models';
import { IResolvedProviderWarehousePair } from 'eatfit247-shared-library';

@Injectable()
export class WarehouseResolverService {
  constructor(
    @InjectModel(TxnCourierProviderAccount)
    private readonly providerAccountRepository: typeof TxnCourierProviderAccount,
    @InjectModel(TxnCourierProviderWarehouse)
    private readonly providerWarehouseRepository: typeof TxnCourierProviderWarehouse,
  ) {}

  /**
   * Returns all active warehouse-provider pairs for the shipment's franchise.
   *
   * Each pair represents: one internal warehouse ↔ one courier provider account
   * that is actively mapped and ready to accept bookings.
   *
   * Results are sorted by provider.priorityOrder ASC so the orchestration
   * service receives pairs in the correct auto-selection order.
   */
  public async resolvePairs(shipment: TxnShipment): Promise<IResolvedProviderWarehousePair[]> {
    // Load active provider accounts for this franchise, with provider details
    const providerAccounts = await this.providerAccountRepository.findAll({
      where: {
        franchiseId: shipment.franchiseId,
        active: true,
      },
      include: [
        {
          model: MstCourierProvider,
          as: 'provider',
          required: true,
          where: { active: true },
        },
      ],
      order: [
        [{ model: MstCourierProvider, as: 'provider' }, 'priorityOrder', 'ASC'],
        ['providerAccountId', 'ASC'],
      ],
    });

    if (providerAccounts.length === 0) {
      return [];
    }

    // Load active warehouse-provider mappings for all relevant providers
    const providerIds = providerAccounts.map((a) => a.providerId);
    const warehouseMappings = await this.providerWarehouseRepository.findAll({
      where: { active: true },
      include: [
        {
          model: MstWarehouse,
          as: 'warehouse',
          required: true,
          where: { active: true },
          attributes: ['warehouseId', 'name', 'pinCode'],
        },
      ],
    });

    const pairs: IResolvedProviderWarehousePair[] = [];

    for (const account of providerAccounts) {
      // provider is guaranteed by the required: true include above
      const provider = account.provider;

      // Find the warehouse mapping for this provider
      const mapping = warehouseMappings.find((m) => m.providerId === account.providerId);

      if (!mapping) {
        // Provider account exists but no warehouse registered with them yet — skip
        continue;
      }

      pairs.push({
        warehouseId: mapping.warehouseId,
        warehousePincode: mapping.warehouse?.pinCode ?? '',
        providerId: account.providerId,
        providerCode: provider.providerCode,
        providerName: provider.providerName,
        priorityOrder: provider.priorityOrder ?? 99,
        providerAccountId: account.providerAccountId,
        providerWarehouseId: mapping.providerWarehouseId ?? undefined,
        providerWarehouseName: mapping.providerWarehouseName ?? undefined,
        credentials: {
          providerAccountId: account.providerAccountId,
          apiBaseUrl: account.apiBaseUrl,
          apiKey: account.apiKey ?? undefined,
          apiSecret: account.apiSecret ?? undefined,
          username: account.username ?? undefined,
          password: account.passwordEncrypted,
          authToken: account.authToken ?? undefined,
          tokenExpiry: account.tokenExpiry ?? undefined,
          authType: provider.authType,
        },
      });
    }

    return pairs;
  }

  /**
   * Resolves a single pair by provider ID — used during booking and tracking.
   */
  public async resolvePairByProvider(
    shipment: TxnShipment,
    providerId: number,
  ): Promise<IResolvedProviderWarehousePair | null> {
    const pairs = await this.resolvePairs(shipment);
    return pairs.find((p) => p.providerId === providerId) ?? null;
  }
}
