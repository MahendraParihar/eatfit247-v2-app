import { Controller, Get, UseGuards } from '@nestjs/common';
import { AddressTypeService, JwtAuthGuard, StateService, MstState } from '@server/common';
import { CountryService } from '@server/common';
import { IAddressMaster, IDropdownItem } from 'eatfit247-shared-lib';
import { InjectModel } from '@nestjs/sequelize';

@Controller('address')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(
    private readonly countryService: CountryService,
    private readonly stateService: StateService,
    private readonly addressTypeService: AddressTypeService,
    @InjectModel(MstState) private readonly stateRepository: typeof MstState,
  ) {}

  @Get('address-master')
  async addressMasterData(): Promise<IAddressMaster> {
    const countryList = await this.countryService.getCountryList();
    const addressTypeList = await this.addressTypeService.getAddressTypeList();
    // Fetch states with countryId for parentId mapping
    const statesWithCountry = await this.stateRepository.findAll({
      where: { active: true },
      attributes: ['stateId', 'state', 'countryId'],
      raw: true,
    });
    const statesWithParentId: IDropdownItem[] = statesWithCountry.map((s: any) => ({
      id: s.stateId,
      label: s.state,
      parentId: s.countryId,
      selected: false,
    }));
    return <IAddressMaster>{
      state: statesWithParentId,
      country: countryList,
      addressType: addressTypeList,
    };
  }
}

