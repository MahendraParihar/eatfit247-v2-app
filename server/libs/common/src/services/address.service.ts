import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { IAddress, IManageAddress } from 'eatfit247-shared-lib';
import { CommonFunctionsUtil } from '@server/common';
import { TxnAddress } from '../models';

@Injectable()
export class AddressService {
  constructor(@InjectModel(TxnAddress) private readonly addressRepository: typeof TxnAddress) {}

  async createOrUpdate(addressData: IManageAddress, cIp: string, adminId: number): Promise<void> {
    const existing = await this.addressRepository.findOne({
      where: {
        tableId: addressData.tableId,
        pkOfTable: addressData.pkOfTable,
        active: true,
      },
    });
    const addressObj = {
      tableId: addressData.tableId,
      pkOfTable: addressData.pkOfTable,
      postalAddress: addressData.postalAddress,
      cityVillage: addressData.cityVillage || null,
      stateId: addressData.stateId || null,
      countryId: addressData.countryId,
      pinCode: addressData.pinCode || null,
      latitude: addressData.latitude ? String(addressData.latitude) : null,
      longitude: addressData.longitude ? String(addressData.longitude) : null,
      addressName: addressData.addressName || null,
      addressTypeId: addressData.addressTypeId || 1,
      active: (addressData as any).active !== undefined ? (addressData as any).active : true,
      modifiedBy: adminId,
      modifiedIp: cIp,
    };
    if (existing) {
      // Update existing address
      addressObj['createdBy'] = existing.createdBy;
      addressObj['createdIp'] = existing.createdIp;
      await this.addressRepository.update(addressObj, {
        where: { addressId: existing.addressId },
      });
    } else {
      // Create a new address
      addressObj['createdBy'] = adminId;
      addressObj['createdIp'] = cIp;
      await this.addressRepository.create(addressObj as any);
    }
  }

  /**
   * Get address by tableId and pkOfTable
   * @param tableId Table ID
   * @param pkOfTable Primary key of the table
   * @returns Address if found, null otherwise
   */
  async findByTableIdAndPk(tableId: number, pkOfTable: number): Promise<IAddress | null> {
    const address = await this.addressRepository.scope('details').findOne({
      where: {
        tableId,
        pkOfTable,
        active: true,
      },
      raw: true,
      nest: true,
    });
    if (!address) {
      return null;
    }
    return this.convertToModel(address);
  }

  async filterByTableIdAndPk(tableId: number, pkOfTable: number): Promise<IAddress[]> {
    const address = await this.addressRepository.scope('details').findAll({
      where: {
        tableId,
        pkOfTable,
        active: true,
      },
      raw: true,
      nest: true,
    });
    return address.map((addr: any) => this.convertToModel(addr));
  }

  /**
   * Get all addresses for an entity
   * @param tableId Table ID
   * @param pkOfTable Primary key of the table
   * @returns Array of addresses
   */
  async findAllByTableIdAndPk(tableId: number, pkOfTable: number): Promise<IManageAddress[]> {
    const addresses = await this.addressRepository.scope('list').findAll({
      where: {
        tableId,
        pkOfTable,
        active: true,
      },
      raw: true,
      nest: true,
    });
    return addresses.map((addr: any) => this.convertToModel(addr));
  }

  /**
   * Delete address by addressId (hard delete)
   * @param addressId Address ID
   * @param cIp Client IP address
   * @param adminId Admin user ID
   */
  async delete(addressId: number, cIp: string, adminId: number): Promise<void> {
    const address = await this.addressRepository.findOne({
      where: { addressId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    await this.addressRepository.update(
      {
        active: false,
        modifiedBy: adminId,
        modifiedIp: cIp,
      },
      {
        where: { addressId },
      },
    );
  }

  /**
   * Convert database model to IAddress interface
   */
  private convertToModel(item: TxnAddress): IAddress {
    return <IAddress>{
      addressId: item.addressId,
      tableId: item.tableId,
      pkOfTable: item.pkOfTable,
      addressName: item.addressName,
      postalAddress: item.postalAddress,
      cityVillage: item.cityVillage || '',
      stateId: item.stateId,
      countryId: item.countryId,
      pinCode: item.pinCode || '',
      addressTypeId: item.addressTypeId,
      addressType: item.addressType?.addressType || '',
      latitude: item.latitude ? parseFloat(item.latitude) : undefined,
      longitude: item.longitude ? parseFloat(item.longitude) : undefined,
      state: item.state?.state || '',
      country: item.country?.country || '',
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
}
