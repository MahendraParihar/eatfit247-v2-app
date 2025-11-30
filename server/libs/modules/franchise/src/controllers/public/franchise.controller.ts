import { Controller, Get, Query } from '@nestjs/common';
import { FranchiseService } from '../../services';
import { ITableList, IFranchise } from 'eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/franchise')
export class PublicFranchiseController {
  constructor(private readonly service: FranchiseService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IFranchise>> {
    return await this.service.findAll(req);
  }
}

