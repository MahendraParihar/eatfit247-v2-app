import { Controller, Get, Query } from '@nestjs/common';
import { HealthIssueService } from '../../services';
import { ITableList, IHealthIssue } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/health-issue')
export class PublicHealthIssueController {
  constructor(private readonly service: HealthIssueService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IHealthIssue>> {
    return await this.service.findAll(req);
  }
}

