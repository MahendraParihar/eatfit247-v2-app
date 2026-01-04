import { Controller, Get, Query } from '@nestjs/common';
import { FranchiseService } from '../../services';
import { IFranchise, ITableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/franchise')
export class PublicFranchiseController {
  constructor(private readonly service: FranchiseService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IFranchise>> {
    return await this.service.findAll(req);
  }
}

