import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ProgramPlanService } from '../../services';
import { IPublicTableList } from '@eatfit247-shared-lib';
import { BasicSearchDto, Public } from '@server_1/core';

@Public()
@Controller('program-plan')
export class PublicProgramPlanController {
  constructor(private readonly service: ProgramPlanService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<IPublicTableList<any>> {
    // Filter only active program plans visible on web
    const searchDto = {
      ...req,
      active: true,
      isVisibleOnWeb: true,
    };
    return await this.service.findAllPublic(searchDto);
  }

  /** The plan a checkout link points at; 404 unless it is active and visible on the web. */
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return await this.service.findPublicById(id);
  }
}

