import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { CommonService } from '../../common/common.service';
import { ConfigParameterService } from '../../config-parameter/config-parameter.service';
import { MemberDietPlanService } from '../services/member-diet-plan.service';
import { MemberDietPlanDetailDto, MemberDietTemplateDto } from '../dto/member-diet-plan-detail.dto';

@Controller('member-diet-plan')
export class MemberDietPlanController {
  constructor(
    private readonly service: MemberDietPlanService,
    private readonly configParameterService: ConfigParameterService,
    private readonly commonService: CommonService,
  ) {
  }

  @UseGuards(JwtAuthGuard)
  @Get('list/:id')
  async list(@Param('id') id: number) {
    return await this.service.findAll(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('manage/:id/:dietPlanId/:cycleNo')
  async getDietPlanDetail(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
  ) {
    return await this.service.fetchDietDetail(memberId, dietPlanId, cycleNo);
  }

  @UseGuards(JwtAuthGuard)
  @Get('manage/:id/:dietPlanId/:cycleNo/:dayNo')
  async getDietPlanDetailDay(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
    @Param('dayNo') dayNo: number,
  ) {
    return await this.service.fetchDietDetail(memberId, dietPlanId, cycleNo, dayNo);
  }

  @UseGuards(JwtAuthGuard)
  @Get('download/:id/:dietPlanId/:cycleNo/:dayNo')
  async downloadDietPlanByDay(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
    @Param('dayNo') dayNo: number,
  ) {
    return await this.service.downloadDietPlan(memberId, dietPlanId, cycleNo, dayNo);
  }

  @UseGuards(JwtAuthGuard)
  @Get('send-email/:id/:dietPlanId/:cycleNo/:dayNo')
  async sendDietPlanViaEmail(
    @Param('id') memberId: number,
    @Param('dietPlanId') dietPlanId: number,
    @Param('cycleNo') cycleNo: number,
    @Param('dayNo') dayNo: number,
  ) {
    return await this.service.sendDietPlan(memberId, dietPlanId, cycleNo, dayNo);
  }

  @UseGuards(JwtAuthGuard)
  @Post('manage/:id')
  async create(@Param('id') memberId: number, @Req() req, @Body() body: MemberDietPlanDetailDto) {
    return await this.service.createDietPlanDetail(memberId, body, req.ip, req.user.userId);
  }

  /*@UseGuards(JwtAuthGuard)
  @Put("manage/:id")
  async update(@Param("id") id: number, @Req() req: any, @Body() body: CreateMemberPaymentDto) {
    return await this.service.update(id, body, req.ip, req.user.userId);
  }*/
  @UseGuards(JwtAuthGuard)
  @Delete('delete-cycle/:id/:cycleNo')
  async deleteCycle(@Param('id') id: number, @Param('cycleNo') cycleNo: number, @Req() req: any) {
    return await this.service.deleteDietPlan(id, cycleNo, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-day/:id/:cycleNo/:dayNo')
  async deleteDay(@Param('id') id: number, @Param('cycleNo') cycleNo: number, @Param('dayNo') dayNo: number, @Req() req: any) {
    return await this.service.deleteDietPlan(id, cycleNo, req.ip, req.user.userId, dayNo);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-details/:id')
  async applyDietTemplate(@Param('id') memberId: number, @Req() req, @Body() body: MemberDietTemplateDto) {
    return await this.service.applyDietTemplate(memberId, body, req.ip, req.user.userId);
  }
}
