import { Controller, Get, Query } from '@nestjs/common';
import { ProgramCategoryService } from '../../services';
import { ITableList, IProgramCategory } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/program-category')
export class PublicProgramCategoryController {
  constructor(private readonly service: ProgramCategoryService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IProgramCategory>> {
    return await this.service.findAll(req);
  }
}

