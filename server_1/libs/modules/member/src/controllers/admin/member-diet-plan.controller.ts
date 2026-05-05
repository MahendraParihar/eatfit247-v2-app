import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AbilitiesGuard, CurrentUser, JwtAuthGuard, RequestedIp, RequireAbility } from '@server_1/core';
import { IFileModel } from '@server_1/platform';
import { MemberDietPlanService } from '../../services';
import { MemberDietPlanDetailDto, MemberDietTemplateDto } from '../../dto';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser } from '@eatfit247-shared-lib';

@Controller('member/:id/diet-plan')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class MemberDietPlanController {
  constructor(private readonly service: MemberDietPlanService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberDietPlan)
  async list(@Param('id') id: number) {
    return await this.service.getList(id);
  }

  @Get('manage/:dietPlanId/:cycleNo')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberDietPlan)
  async getDietPlanDetail(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
    @Query('copyFromCycleNo') copyFromCycleNo: number,
    @Query('copyFromDayNo') copyFromDayNo: number,
  ) {
    return await this.service.fetchDietDetail(
      memberId,
      dietPlanId,
      cycleNo,
      null,
      copyFromCycleNo,
      copyFromDayNo,
    );
  }

  @Get('manage/:dietPlanId/:cycleNo/:dayNo')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberDietPlan)
  async getDietPlanDetailDay(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
    @Param('dayNo') dayNo: number,
    @Query('copyFromCycleNo') copyFromCycleNo: number,
    @Query('copyFromDayNo') copyFromDayNo: number,
  ) {
    return await this.service.fetchDietDetail(
      memberId,
      dietPlanId,
      cycleNo,
      dayNo,
      copyFromCycleNo,
      copyFromDayNo,
    );
  }

  @Get('download-cycle/:dietPlanId/:cycleNo')
  @Header('Content-Type', 'application/pdf')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberDietPlan)
  async downloadDietPlanByCycle(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
  ): Promise<IFileModel> {
    return await this.service.downloadDietPlan(memberId, dietPlanId, cycleNo, null);
  }

  @Get('download-day/:dietPlanId/:cycleNo/:dayNo')
  @Header('Content-Type', 'application/pdf')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberDietPlan)
  async downloadDietPlanByDay(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
    @Param('dayNo') dayNo: number,
  ): Promise<IFileModel> {
    return await this.service.downloadDietPlan(memberId, dietPlanId, cycleNo, dayNo);
  }

  @Get('send-email-cycle/:dietPlanId/:cycleNo')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberDietPlan)
  async sendDietPlanViaEmailCycle(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
  ) {
    return await this.service.sendDietPlan(memberId, dietPlanId, cycleNo);
  }

  @Get('send-email-day/:dietPlanId/:cycleNo/:dayNo')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberDietPlan)
  async sendDietPlanViaEmailDay(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
    @Param('dayNo') dayNo: number,
  ) {
    return await this.service.sendDietPlan(memberId, dietPlanId, cycleNo, dayNo);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.MemberDietPlan)
  async create(
    @Param('id') memberId: number,
    @Body() body: MemberDietPlanDetailDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ) {
    return await this.service.createDietPlanDetail(
      memberId,
      body,
      requestedIp,
      currentUser.adminId,
    );
  }

  @Delete('delete-cycle/:dietPlanId/:cycleNo')
  @RequireAbility(AdminActionEnum.Delete, AdminSubjectEnum.MemberDietPlan)
  async deleteCycle(
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ) {
    return await this.service.deleteDietPlan(dietPlanId, cycleNo, requestedIp, currentUser.adminId);
  }

  @Delete('delete-day/:dietPlanId/:cycleNo/:dayNo')
  @RequireAbility(AdminActionEnum.Delete, AdminSubjectEnum.MemberDietPlan)
  async deleteDay(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
    @Param('dayNo') dayNo: number,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ) {
    return await this.service.deleteDietPlan(
      dietPlanId,
      cycleNo,
      requestedIp,
      currentUser.adminId,
      dayNo,
    );
  }

  @Post('update-details')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberDietPlan)
  async applyDietTemplate(
    @Param('id') memberId: number,
    @Body() body: MemberDietTemplateDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ) {
    return await this.service.applyDietTemplate(memberId, body, requestedIp, currentUser.adminId);
  }

  @Put('update-status/:dietPlanId')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberDietPlan)
  async updateStatus(
    @Param('id') id: number,
    @Param('dietPlanId') dietPlanId: number,
    @Body() body: { statusId?: number },
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ) {
    return await this.service.updateStatus(id, dietPlanId, body?.statusId, currentUser.adminId, requestedIp);
  }
}
