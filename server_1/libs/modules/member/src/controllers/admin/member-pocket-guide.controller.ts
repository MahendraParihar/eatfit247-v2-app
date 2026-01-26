import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, RequestedIp, UpdatePocketGuideIdsDto } from '@server_1/core';
import { MemberPocketGuideService } from '../../services';
import { IMemberPocketGuide, ITableList } from '@eatfit247-shared-lib';

@Controller('member/:id/pocket-guide')
@UseGuards(JwtAuthGuard)
export class MemberPocketGuideController {
  constructor(private readonly memberPocketGuideService: MemberPocketGuideService) {}

  @Get()
  async getPocketGuides(@Param('id') id: number): Promise<ITableList<IMemberPocketGuide>> {
    return await this.memberPocketGuideService.getList(id, true);
  }

  @Get('list')
  async getPocketGuideList(@Param('id') id: number): Promise<ITableList<IMemberPocketGuide>> {
    return await this.memberPocketGuideService.getList(id, false);
  }

  @Put('manage')
  async managePocketGuides(
    @Param('id') id: number,
    @Body() body: UpdatePocketGuideIdsDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.memberPocketGuideService.manage(
      id,
      body.pocketGuideIds,
      requestedIp,
      currentUser.adminId,
    );
  }
}
