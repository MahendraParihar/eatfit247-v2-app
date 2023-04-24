import { Injectable } from '@nestjs/common';
import { MstCountries } from '../../core/database/models/mst-countries.model';
import { DropdownListInterface } from '../../response-interface/dropdown-list.interface';
import { MstAdminRole } from '../../core/database/models/mst-admin-role.model';
import { InjectModel } from '@nestjs/sequelize';
import { UserStatusEnum } from '../../enums/user-status-enum';
import { MstState } from '../../core/database/models/mst-state.model';
import { TxnAddress } from '../../core/database/models/txn-address.model';
import { IAddress } from '../../response-interface/address.interface';
import { MstAddressType } from '../../core/database/models/mst-address-type.model';

@Injectable()
export class CommonService {
  constructor(
    @InjectModel(MstState) private readonly stateRepository: typeof MstState,
    @InjectModel(MstCountries)
    private readonly countryRepository: typeof MstCountries,
    @InjectModel(MstAddressType)
    private readonly addressTypeRepository: typeof MstAddressType,
    @InjectModel(TxnAddress)
    private readonly addressRepository: typeof TxnAddress,
    @InjectModel(MstAdminRole)
    private readonly adminRoleRepository: typeof MstAdminRole,
  ) {}

  // region Address
  public async findAddress(tableIdIn: number, pkOfTableIn: number): Promise<IAddress> {
    try {
      const addressObj = await this.addressRepository.findOne<TxnAddress>({
        where: {
          active: true,
          tableId: tableIdIn,
          pkOfTable: pkOfTableIn,
        },
        include: [
          {
            model: MstAddressType,
            required: true,
            attributes: ['addressType'],
          },
          {
            model: MstState,
            required: true,
            attributes: ['state'],
          },
          {
            model: MstCountries,
            required: true,
            attributes: ['country'],
          },
        ],
        raw: true,
        nest: true,
      });

      if (!addressObj) {
        return null;
      }
      return this.convertDbToAddressObj(addressObj);
    } catch (e) {
      throw e;
    }
  }

  public async findAddresses(tableIdIn: number, pkOfTableIn: number): Promise<IAddress[]> {
    try {
      const addressObjs = await this.addressRepository.findAll<TxnAddress>({
        where: {
          active: true,
          tableId: tableIdIn,
          pkOfTable: pkOfTableIn,
        },
        include: [
          {
            model: MstAddressType,
            required: true,
            attributes: ['addressType'],
          },
          {
            model: MstState,
            required: true,
            attributes: ['state'],
          },
          {
            model: MstCountries,
            required: true,
            attributes: ['country'],
          },
        ],
        raw: true,
        nest: true,
      });

      if (!addressObjs || addressObjs.length === 0) {
        return null;
      }

      const list: IAddress[] = [];
      for (const addressObj of addressObjs) {
        list.push(this.convertDbToAddressObj(addressObj));
      }

      return list;
    } catch (e) {
      throw e;
    }
  }

  public async findAddressById(addressIdIn: number): Promise<IAddress> {
    try {
      const addressObj = await this.addressRepository.findOne<TxnAddress>({
        where: {
          active: true,
          addressId: addressIdIn,
        },
        include: [
          {
            model: MstAddressType,
            required: true,
            attributes: ['addressType'],
          },
          {
            model: MstState,
            required: true,
            attributes: ['state'],
          },
          {
            model: MstCountries,
            required: true,
            attributes: ['country'],
          },
        ],
        raw: true,
        nest: true,
      });

      if (!addressObj) {
        return null;
      }

      return this.convertDbToAddressObj(addressObj);
    } catch (e) {
      throw e;
    }
  }

  public convertDbToAddressObj(addressObj): IAddress {
    if (!addressObj) {
      return null;
    }
    return {
      addressId: addressObj.addressId,
      addressTypeId: addressObj.addressTypeId,
      addressType: addressObj['AddressType']['addressType'],
      postalAddress: addressObj.postalAddress,
      cityVillage: addressObj.cityVillage,
      stateId: addressObj.stateId,
      state: addressObj['AddressState']['state'],
      countryId: addressObj.countryId,
      country: addressObj['AddressCountry']['country'],
      pinCode: addressObj.pinCode,
      latitude: addressObj.latitude,
      longitude: addressObj.longitude,
    };
  }

  public async addAddress(addressObj: any): Promise<TxnAddress> {
    try {
      const createdObj = await this.addressRepository.create(addressObj);
      if (createdObj) {
        return createdObj;
      } else {
        return null;
      }
    } catch (e) {
      throw e;
    }
  }

  public async updateAddressByTableNPkOfTable(
    tableId: number,
    pkOfTable: number,
    addressObj: any,
  ): Promise<TxnAddress> {
    try {
      const updateObj = await this.addressRepository.update(addressObj, {
        returning: true,
        where: {
          tableId: tableId,
          pkOfTable: pkOfTable,
        },
      });
      if (updateObj) {
        return updateObj[1][0];
      } else {
        return null;
      }
    } catch (e) {
      throw e;
    }
  }

  public async getAddressTypeList(): Promise<DropdownListInterface[]> {
    const tempList = await this.addressTypeRepository.findAll<MstAddressType>({
      where: {
        active: true,
      },
      order: [['addressType', 'ASC']],
    });
    const list: DropdownListInterface[] = [];
    for (const t of tempList) {
      list.push({
        id: t.addressTypeId,
        name: t.addressType,
        selected: false,
      });
    }
    return list;
  }

  // endregion

  // region Contact Type
  /*public async getContactTypeList(): Promise<DropdownListInterface[]> {
    const tempList = await this.contactTypeRepository.findAll<MstContactType>({
      where: {
        active: true,
      },
      order: [['contactType', 'ASC']],
    });
    const list: DropdownListInterface[] = [];
    for (const t of tempList) {
      list.push({
        id: t.contactTypeId,
        name: t.contactType,
        selected: false,
      });
    }
    return list;
  }*/

  // endregion

  public async getCountryList(): Promise<DropdownListInterface[]> {
    const tempList = await this.countryRepository.findAll<MstCountries>({
      where: {
        active: true,
      },
      order: [['country', 'ASC']],
    });
    const list: DropdownListInterface[] = [];
    for (const t of tempList) {
      list.push({
        id: t.countryId,
        name: t.country,
        selected: false,
      });
    }
    return list;
  }

  public async getCountryCodeList(): Promise<DropdownListInterface[]> {
    const tempList = await this.countryRepository.findAll<MstCountries>({
      where: {
        active: true,
      },
      order: [['country', 'ASC']],
    });
    const list: DropdownListInterface[] = [];
    for (const t of tempList) {
      list.push({
        id: t.countryCode,
        name: `${t.country} (${t.countryCode})`,
        selected: false,
      });
    }
    return list;
  }

  public async getCountryPhoneCodeList(): Promise<DropdownListInterface[]> {
    const tempList = await this.countryRepository.findAll<MstCountries>({
      where: {
        active: true,
      },
      order: [['country', 'ASC']],
    });
    const list: DropdownListInterface[] = [];
    for (const t of tempList) {
      list.push({
        id: t.phoneNumberCode,
        name: `${t.country} (${t.phoneNumberCode})`,
        selected: false,
      });
    }
    return list;
  }

  public async getStateList(): Promise<DropdownListInterface[]> {
    const tempList = await this.stateRepository.findAll<MstState>({
      where: {
        active: true,
      },
      order: [['state', 'ASC']],
    });
    const list: DropdownListInterface[] = [];
    for (const t of tempList) {
      list.push({
        id: t.stateId,
        name: t.state,
        selected: false,
        parentId: t.countryId,
      });
    }
    return list;
  }

  public async getAdminRoleList(adminId: number): Promise<DropdownListInterface[]> {
    const tempList = await this.adminRoleRepository.findAll<MstAdminRole>();
    const list: DropdownListInterface[] = [];
    for (const t of tempList) {
      list.push({
        id: t.roleId,
        name: t.role,
        selected: false,
      });
    }
    return list;
  }

  public async getAdminStatsList(): Promise<DropdownListInterface[]> {
    const list: DropdownListInterface[] = [];
    list.push({
      id: UserStatusEnum.ACTIVE,
      name: 'Active',
      selected: false,
    });
    list.push({
      id: UserStatusEnum.VERIFICATION_PENDING,
      name: 'Email Id verification pending',
      selected: false,
    });
    list.push({
      id: UserStatusEnum.IN_ACTIVE,
      name: 'In-Active',
      selected: false,
    });
    return list;
  }
}
