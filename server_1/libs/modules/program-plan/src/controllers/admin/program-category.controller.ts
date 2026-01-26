import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { BasicSearchDto, CurrentUser, JwtAuthGuard, RequestedIp, UpdateActiveDto } from '@server_1/core';
import { ProgramCategoryService } from '../../services';
import { CreateProgramCategoryDto } from '../../dto';
import { IDropdownItem, IProgramCategory, ITableList } from '@eatfit247-shared-lib';

@Controller('program-category')
@UseGuards(JwtAuthGuard)
export class ProgramCategoryController {
  constructor(private readonly service: ProgramCategoryService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IProgramCategory>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IProgramCategory> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateProgramCategoryDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateProgramCategoryDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
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

  @Get('dropdown')
  async getDropdown(): Promise<{ programCategory: IDropdownItem[] }> {
    const categories = await this.service.getProgramCategoryList();
    return {
      programCategory: categories,
    };
  }
}

