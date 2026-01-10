import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProgramService } from '../../services';
import { IPublicProgram, IPublicTableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';
import { Public } from '@server_1/core';

@Public()
@Controller('program')
export class PublicProgramController {
  constructor(private readonly service: ProgramService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<IPublicTableList<IPublicProgram>> {
    // Filter only active programs
    const searchDto = {
      ...req,
      active: true,
    };
    return await this.service.findAllPublic(searchDto);
  }

  @Get(':id')
  async getById(@Param('id') id: number): Promise<IPublicProgram> {
    return await this.service.fetchByIdPublic(id);
  }

  @Get('by-url/:url')
  async getByUrl(@Param('url') url: string): Promise<IPublicProgram> {
    return await this.service.fetchByUrlPublic(url);
  }
}

