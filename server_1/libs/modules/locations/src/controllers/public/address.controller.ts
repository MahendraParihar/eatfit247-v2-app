import { Controller, Get } from '@nestjs/common';
import { Public } from '@server_1/core';
import { CountryService, MstState } from '@server_1/platform';
import { IAddressMaster, IDropdownItem } from '@eatfit247-shared-lib';
import { InjectModel } from '@nestjs/sequelize';

@Public()
@Controller('address')
export class PublicAddressController {
  constructor(
    private readonly countryService: CountryService,
    @InjectModel(MstState) private readonly stateRepository: typeof MstState,
  ) {}

  @Get('address-master')
  async addressMasterData(): Promise<IAddressMaster> {
    const countryList = await this.countryService.getCountryList();
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
    };
  }
}

