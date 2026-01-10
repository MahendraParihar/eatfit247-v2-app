import { Controller, Get, Query } from '@nestjs/common';
import { BasicSearchDto } from '@server_1/shared-dto';
import { SuccessStoryService } from '../../services';
import { ISuccessStory, ITableList } from '@eatfit247-shared-lib';
import { Public } from '@server_1/core';

@Public()
@Controller('success-story')
export class PublicSuccessStoryController {
  constructor(
    private readonly service: SuccessStoryService,
  ) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto & { active?: boolean }): Promise<ITableList<ISuccessStory>> {
    // For public endpoints, only show active success stories by default
    const searchDto: BasicSearchDto = {
      ...req,
      active: true,
    };
    return await this.service.findAll(searchDto);
  }
}

