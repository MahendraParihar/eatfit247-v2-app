import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp, BasicSearchDto, UpdateActiveDto } from '@server/common';
import { PocketGuideService } from '../../services';
import { CreatePocketGuideDto } from '../../dto';
import { ITableList, IPocketGuide } from 'eatfit247-shared-lib';

@Controller('pocket-guide')
@UseGuards(JwtAuthGuard)
export class PocketGuideController {
  constructor(private readonly service: PocketGuideService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IPocketGuide>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IPocketGuide> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreatePocketGuideDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreatePocketGuideDto,
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

