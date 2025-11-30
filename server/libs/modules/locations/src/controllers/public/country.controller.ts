import { Controller, Get, Query } from '@nestjs/common';
import { CountryService } from '../../services';
import { ITableList, ICountry } from 'eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/country')
export class PublicCountryController {
  constructor(private readonly service: CountryService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ICountry>> {
    return await this.service.findAll(req);
  }
}

