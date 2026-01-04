import { Controller, Get, Query } from '@nestjs/common';
import { IssueStatusService } from '../../services';
import { IIssueStatus, ITableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/issue-status')
export class PublicIssueStatusController {
  constructor(private readonly service: IssueStatusService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IIssueStatus>> {
    return await this.service.findAll(req);
  }
}

