import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp, BasicSearchDto, UpdateActiveDto } from '@server/common';
import { ProgramPlanService } from '../../services';
import { CreateProgramPlanDto } from '../../dto';
import { ITableList, IProgramPlan, IResponse } from 'eatfit247-shared-lib';

@Controller('program-plan')
@UseGuards(JwtAuthGuard)
export class ProgramPlanController {
  constructor(private readonly service: ProgramPlanService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IProgramPlan>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IResponse<IProgramPlan>> {
    const data = await this.service.fetchById(id);
    return { data };
  }

  @Post('manage')
  async create(
    @Body() body: CreateProgramPlanDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateProgramPlanDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.userId || currentUser.adminId);
  }
}

