import { Controller, Get } from '@nestjs/common';
import { Public } from '@server_1/core';
import { CountryService } from '@server_1/platform';
import { InjectModel } from '@nestjs/sequelize';
import { MstCountry } from '@server_1/platform';

@Public()
@Controller('member-payment')
export class PublicMemberPaymentController {
  constructor(
    private readonly countryService: CountryService,
    @InjectModel(MstCountry) private readonly countryRepository: typeof MstCountry,
  ) {}

  @Get('master-data')
  async getMasterData(): Promise<{
    country: Array<{ id: number; label: string; phoneNumberCode: string | null }>;
    countryCode: Array<{ id: string; label: string }>;
  }> {
    const [countryList, countryCodeList] = await Promise.all([
      this.getCountryListWithPhoneCode(),
      this.countryService.getCountryPhoneCodeList(),
    ]);

    return {
      country: countryList,
      countryCode: countryCodeList,
    };
  }

  private async getCountryListWithPhoneCode(): Promise<Array<{ id: number; label: string; phoneNumberCode: string | null }>> {
    const tempList = await this.countryRepository.findAll<MstCountry>({
      where: { active: true },
      order: [['country', 'ASC']],
      raw: true,
      nest: true,
    });
    return tempList.map((t) => ({
      id: t.countryId,
      label: t.country,
      phoneNumberCode: t.phoneNumberCode || null,
    }));
  }
}

