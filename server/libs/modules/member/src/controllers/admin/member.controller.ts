import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp, BasicSearchDto } from '@server/common';
import { MemberService } from '../../services';
import { CreateMemberDto } from '../../dto';
import { ITableList, IMember } from 'eatfit247-shared-lib';

@Controller('member')
@UseGuards(JwtAuthGuard)
export class MemberController {
  constructor(private readonly service: MemberService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IMember>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IMember> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateMemberDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateMemberDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: { active: boolean; deactivationReason?: string },
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(
      id,
      body.active,
      body.deactivationReason || null,
      requestedIp,
      currentUser.userId || currentUser.adminId,
    );
  }
}
