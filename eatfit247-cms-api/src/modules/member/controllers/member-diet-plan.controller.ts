import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../account/jwt-auth.guard";
import { MemberDietPlanService } from "../services/member-diet-plan.service";
import { MemberDietPlanDetailDto, MemberDietTemplateDto } from "../dto/member-diet-plan-detail.dto";

@Controller("member-diet-plan")
export class MemberDietPlanController {
  constructor(private readonly service: MemberDietPlanService) { }

  @UseGuards(JwtAuthGuard)
  @Get("list/:id")
  async list(@Param("id") id: number) {
    return await this.service.findAll(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("manage/:id/:dietPlanId/:cycleNo")
  async getDietPlanDetail(
    @Param("id") memberId: number,
    @Param("dietPlanId") dietPlanId: number,
    @Param("cycleNo") cycleNo: number,
    @Query("copyFromCycleNo") copyFromCycleNo: number,
    @Query("copyFromDayNo") copyFromDayNo: number
  ) {
    return await this.service.fetchDietDetail(memberId, dietPlanId, cycleNo, null, copyFromCycleNo, copyFromDayNo);
  }

  @UseGuards(JwtAuthGuard)
  @Get("manage/:id/:dietPlanId/:cycleNo/:dayNo")
  async getDietPlanDetailDay(
    @Param("id") memberId: number,
    @Param("dietPlanId") dietPlanId: number,
    @Param("cycleNo") cycleNo: number,
    @Param("dayNo") dayNo: number,
    @Query("copyFromCycleNo") copyFromCycleNo: number,
    @Query("copyFromDayNo") copyFromDayNo: number
  ) {
    return await this.service.fetchDietDetail(memberId, dietPlanId, cycleNo, dayNo, copyFromCycleNo, copyFromDayNo);
  }

  @UseGuards(JwtAuthGuard)
  @Get("download-cycle/:id/:dietPlanId/:cycleNo")
  async downloadDietPlanByCycle(
    @Param("id") memberId: number,
    @Param("dietPlanId") dietPlanId: number,
    @Param("cycleNo") cycleNo: number
  ) {
    return await this.service.downloadDietPlan(memberId, dietPlanId, cycleNo, null);
  }

  @UseGuards(JwtAuthGuard)
  @Get("download-day/:id/:dietPlanId/:cycleNo/:dayNo")
  async downloadDietPlanByDay(
    @Param("id") memberId: number,
    @Param("dietPlanId") dietPlanId: number,
    @Param("cycleNo") cycleNo: number,
    @Param("dayNo") dayNo: number
  ) {
    return await this.service.downloadDietPlan(memberId, dietPlanId, cycleNo, dayNo);
  }

  @UseGuards(JwtAuthGuard)
  @Get("send-email-cycle/:id/:dietPlanId/:cycleNo")
  async sendDietPlanViaEmailCycle(
    @Param("id") memberId: number,
    @Param("dietPlanId") dietPlanId: number,
    @Param("cycleNo") cycleNo: number
  ) {
    return await this.service.sendDietPlan(memberId, dietPlanId, cycleNo);
  }

  @UseGuards(JwtAuthGuard)
  @Get("send-email-day/:id/:dietPlanId/:cycleNo/:dayNo")
  async sendDietPlanViaEmailDay(
    @Param("id") memberId: number,
    @Param("dietPlanId") dietPlanId: number,
    @Param("cycleNo") cycleNo: number,
    @Param("dayNo") dayNo: number
  ) {
    return await this.service.sendDietPlan(memberId, dietPlanId, cycleNo, dayNo);
  }

  @UseGuards(JwtAuthGuard)
  @Post("manage/:id")
  async create(@Param("id") memberId: number, @Req() req, @Body() body: MemberDietPlanDetailDto) {
    return await this.service.createDietPlanDetail(memberId, body, req.ip, req.user.userId);
  }

  /*@UseGuards(JwtAuthGuard)
  @Put("manage/:id")
  async update(@Param("id") id: number, @Req() req: any, @Body() body: CreateMemberPaymentDto) {
    return await this.service.update(id, body, req.ip, req.user.userId);
  }*/
  @UseGuards(JwtAuthGuard)
  @Delete("delete-cycle/:id/:cycleNo")
  async deleteCycle(@Param("id") id: number, @Param("cycleNo") cycleNo: number, @Req() req: any) {
    return await this.service.deleteDietPlan(id, cycleNo, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("delete-day/:id/:cycleNo/:dayNo")
  async deleteDay(@Param("id") id: number, @Param("cycleNo") cycleNo: number, @Param("dayNo") dayNo: number, @Req() req: any) {
    return await this.service.deleteDietPlan(id, cycleNo, req.ip, req.user.userId, dayNo);
  }

  @UseGuards(JwtAuthGuard)
  @Post("update-details/:id")
  async applyDietTemplate(@Param("id") memberId: number, @Req() req, @Body() body: MemberDietTemplateDto) {
    return await this.service.applyDietTemplate(memberId, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put("update-status/:id/:dietPlanId")
  async updateStatus(@Param("id") id: number, @Param("dietPlanId") dietPlanId: number, @Req() req) {
    return await this.service.updateStatus(id, dietPlanId, req.user.userId, req.ip);
  }
}
