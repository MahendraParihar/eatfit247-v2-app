import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  BasicSearchDto,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateActiveDto,
} from '@server_1/core';
import { ProgramCategoryService, ProgramService } from '../../services';
import { CreateProgramDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IDropdownItem,
  IProgram,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('program')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class ProgramController {
  constructor(
    private readonly service: ProgramService,
    private readonly programCategoryService: ProgramCategoryService,
  ) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Program)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IProgram>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Program)
  async getById(@Param('id') id: number): Promise<IProgram> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.Program)
  async create(
    @Body() body: CreateProgramDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Program)
  async update(
    @Param('id') id: number,
    @Body() body: CreateProgramDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Program)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Get('program-master')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Program)
  async programMasterData(): Promise<{ programCategory: IDropdownItem[] }> {
    const categories = await this.programCategoryService.getProgramCategoryList();
    return {
      programCategory: categories,
    };
  }
}

