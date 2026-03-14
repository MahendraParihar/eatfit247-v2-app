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
import { CurrentUser, JwtAuthGuard, RequestedIp } from '@server_1/core';
import { IFileModel } from '@server_1/platform';
import { MemberDietPlanService } from '../../services';
import { MemberDietPlanDetailDto, MemberDietTemplateDto } from '../../dto';
import { IAuthUser } from '@eatfit247-shared-lib';

@Controller('member/:id/diet-plan')
@UseGuards(JwtAuthGuard)
export class MemberDietPlanController {
  constructor(private readonly service: MemberDietPlanService) {}

  @Get('list')
  async list(@Param('id') id: number) {
    return await this.service.getList(id);
  }

  @Get('manage/:dietPlanId/:cycleNo')
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
  async downloadDietPlanByCycle(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
  ): Promise<IFileModel> {
    return await this.service.downloadDietPlan(memberId, dietPlanId, cycleNo, null);
  }

  @Get('download-day/:dietPlanId/:cycleNo/:dayNo')
  @Header('Content-Type', 'application/pdf')
  async downloadDietPlanByDay(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
    @Param('dayNo') dayNo: number,
  ): Promise<IFileModel> {
    return await this.service.downloadDietPlan(memberId, dietPlanId, cycleNo, dayNo);
  }

  @Get('send-email-cycle/:dietPlanId/:cycleNo')
  async sendDietPlanViaEmailCycle(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
  ) {
    return await this.service.sendDietPlan(memberId, dietPlanId, cycleNo);
  }

  @Get('send-email-day/:dietPlanId/:cycleNo/:dayNo')
  async sendDietPlanViaEmailDay(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
    @Param('dayNo') dayNo: number,
  ) {
    return await this.service.sendDietPlan(memberId, dietPlanId, cycleNo, dayNo);
  }

  @Post('manage')
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
  async deleteCycle(
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ) {
    return await this.service.deleteDietPlan(dietPlanId, cycleNo, requestedIp, currentUser.adminId);
  }

  @Delete('delete-day/:dietPlanId/:cycleNo/:dayNo')
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
  async applyDietTemplate(
    @Param('id') memberId: number,
    @Body() body: MemberDietTemplateDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ) {
    return await this.service.applyDietTemplate(memberId, body, requestedIp, currentUser.adminId);
  }

  @Put('update-status/:dietPlanId')
  async updateStatus(
    @Param('id') id: number,
    @Param('dietPlanId') dietPlanId: number,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ) {
    return await this.service.updateStatus(id, dietPlanId, currentUser.adminId, requestedIp);
  }
}
