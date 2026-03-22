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
import { ProgramCategoryService } from '../../services';
import { CreateProgramCategoryDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IDropdownItem,
  IProgramCategory,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('program-category')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class ProgramCategoryController {
  constructor(private readonly service: ProgramCategoryService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.ProgramCategory)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IProgramCategory>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.ProgramCategory)
  async getById(@Param('id') id: number): Promise<IProgramCategory> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.ProgramCategory)
  async create(
    @Body() body: CreateProgramCategoryDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.ProgramCategory)
  async update(
    @Param('id') id: number,
    @Body() body: CreateProgramCategoryDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.ProgramCategory)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Get('dropdown')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.ProgramCategory)
  async getDropdown(): Promise<{ programCategory: IDropdownItem[] }> {
    const categories = await this.service.getProgramCategoryList();
    return {
      programCategory: categories,
    };
  }
}

