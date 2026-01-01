import { Controller, Get, Query } from '@nestjs/common';
import { ProgramPlanService } from '../../services';
import { ITableList, IProgramPlan } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/program-plan')
export class PublicProgramPlanController {
  constructor(private readonly service: ProgramPlanService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IProgramPlan>> {
    return await this.service.findAll(req);
  }
}

