import { Controller, Get, Query } from '@nestjs/common';
import { CountryService } from '@server_1/platform';
import { ICountry, ITableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/country')
export class PublicCountryController {
  constructor(private readonly service: CountryService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ICountry>> {
    return await this.service.findAll(req);
  }
}

