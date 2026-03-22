import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdatePocketGuideIdsDto,
} from '@server_1/core';
import { MemberPocketGuideService } from '../../services';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, IMemberPocketGuide, ITableList } from '@eatfit247-shared-lib';

@Controller('member/:id/pocket-guide')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class MemberPocketGuideController {
  constructor(private readonly memberPocketGuideService: MemberPocketGuideService) {}

  @Get()
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberPocketGuide)
  async getPocketGuides(@Param('id') id: number): Promise<ITableList<IMemberPocketGuide>> {
    return await this.memberPocketGuideService.getList(id, true);
  }

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberPocketGuide)
  async getPocketGuideList(@Param('id') id: number): Promise<ITableList<IMemberPocketGuide>> {
    return await this.memberPocketGuideService.getList(id, false);
  }

  @Put('manage')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberPocketGuide)
  async managePocketGuides(
    @Param('id') id: number,
    @Body() body: UpdatePocketGuideIdsDto,
    @CurrentUser() currentUser: IAuthUser,
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
