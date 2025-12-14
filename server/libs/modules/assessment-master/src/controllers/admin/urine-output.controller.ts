import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp, BasicSearchDto, UpdateActiveDto } from '@server/common';
import { UrineOutputService } from '../../services';
import { CreateUrineOutputDto } from '../../dto';
import { ITableList, IUrineOutput, IDropdownItem, IResponse } from 'eatfit247-shared-lib';

@Controller('urine-output')
@UseGuards(JwtAuthGuard)
export class UrineOutputController {
  constructor(private readonly service: UrineOutputService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IUrineOutput>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IResponse<IUrineOutput>> {
    const data = await this.service.fetchById(id);
    return { data };
  }

  @Post('manage')
  async create(
    @Body() body: CreateUrineOutputDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateUrineOutputDto,
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

  @Get('dropdown')
  async getDropdownList(): Promise<IDropdownItem[]> {
    return await this.service.getUrineOutputList();
  }
}

