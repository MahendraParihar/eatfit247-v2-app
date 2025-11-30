import { Controller, Get, Query } from '@nestjs/common';
import { ProgramService } from '../../services';
import { ITableList, IProgram } from 'eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/program')
export class PublicProgramController {
  constructor(private readonly service: ProgramService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IProgram>> {
    return await this.service.findAll(req);
  }
}

