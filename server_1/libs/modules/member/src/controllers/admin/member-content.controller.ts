import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdatePocketGuideIdsDto,
} from '@server_1/core';
import { MemberDietPlanService, MemberPocketGuideService } from '../../services';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IDropdownItem,
  IMemberDietPlan,
  IMemberPocketGuide,
  ITableList,
} from '@eatfit247-shared-lib';

/**
 * Consolidated controller for member content/resources:
 * - Pocket guide management
 * - Diet plan management (TODO: when service is implemented)
 */
@Controller('member/:id')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class MemberContentController {
  constructor(
    private readonly memberPocketGuideService: MemberPocketGuideService,
    private readonly memberDietPlanService: MemberDietPlanService,
  ) {}

  // ==================== POCKET GUIDE ENDPOINTS ====================
  // Route: member/:id/pocket-guide

  @Get('pocket-guide')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberPocketGuide)
  async getPocketGuides(@Param('id') id: number): Promise<ITableList<IMemberPocketGuide>> {
    return await this.memberPocketGuideService.getList(id, true);
  }

  @Get('pocket-guide/list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberPocketGuide)
  async getPocketGuideList(@Param('id') id: number): Promise<ITableList<IMemberPocketGuide>> {
    return await this.memberPocketGuideService.getList(id, false);
  }

  @Put('pocket-guide/manage')
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

  // ==================== DIET PLAN ENDPOINTS ====================
  // Route: member/:id/diet-plan

  @Get('diet-plan/list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberDietPlan)
  async getDietPlanList(@Param('id') id: number): Promise<{
    list: IMemberDietPlan[];
    count: number;
    dietTemplateList: IDropdownItem[];
  }> {
    return await this.memberDietPlanService.getList(id);
  }

  @Get('diet-plan')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberDietPlan)
  async getDietPlan(@Param('id') id: number): Promise<any> {
    // TODO: Implement diet plan service and endpoints
    return null;
  }
}

