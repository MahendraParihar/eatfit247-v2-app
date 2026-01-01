import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp } from '@server_1/core';
import { MemberPocketGuideService } from '../../services';
import { ITableList, IMemberPocketGuide } from '@eatfit247-shared-lib';

/**
 * Consolidated controller for member content/resources:
 * - Pocket guide management
 * - Diet plan management (TODO: when service is implemented)
 */
@Controller('member/:id')
@UseGuards(JwtAuthGuard)
export class MemberContentController {
  constructor(private readonly memberPocketGuideService: MemberPocketGuideService) {}

  // ==================== POCKET GUIDE ENDPOINTS ====================
  // Route: member/:id/pocket-guide

  @Get('pocket-guide')
  async getPocketGuides(@Param('id') id: number): Promise<ITableList<IMemberPocketGuide>> {
    return await this.memberPocketGuideService.getList(id, true);
  }

  @Get('pocket-guide/list')
  async getPocketGuideList(@Param('id') id: number): Promise<ITableList<IMemberPocketGuide>> {
    return await this.memberPocketGuideService.getList(id, false);
  }

  @Put('pocket-guide/manage')
  async managePocketGuides(
    @Param('id') id: number,
    @Body() body: { pocketGuideIds: number[] },
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.memberPocketGuideService.manage(
      id,
      body.pocketGuideIds,
      requestedIp,
      currentUser.userId || currentUser.adminId,
    );
  }

  // ==================== DIET PLAN ENDPOINTS ====================
  // Route: member/:id/diet-plan
  // TODO: Implement diet plan service and endpoints

  @Get('diet-plan')
  async getDietPlan(@Param('id') id: number): Promise<any> {
    // TODO: Implement diet plan service and endpoints
    return null;
  }
}

