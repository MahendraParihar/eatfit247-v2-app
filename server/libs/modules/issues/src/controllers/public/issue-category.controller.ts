import { Controller, Get, Query } from '@nestjs/common';
import { IssueCategoryService } from '../../services';
import { ITableList, IIssueCategory } from 'eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/issue-category')
export class PublicIssueCategoryController {
  constructor(private readonly service: IssueCategoryService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IIssueCategory>> {
    return await this.service.findAll(req);
  }
}

