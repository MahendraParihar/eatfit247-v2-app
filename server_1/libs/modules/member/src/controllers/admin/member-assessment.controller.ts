import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
} from '@server_1/core';
import { MemberAssessmentService } from '../../services';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, IMemberAssessment } from '@eatfit247-shared-lib';
import { CreateMemberAssessmentDto } from '../../dto';

@Controller('member/:id/assessment')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class MemberAssessmentController {
  constructor(private readonly memberAssessmentService: MemberAssessmentService) {}

  @Get()
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberAssessment)
  async getAssessment(@Param('id') id: number): Promise<IMemberAssessment | null> {
    return await this.memberAssessmentService.findByMemberId(id);
  }

  @Put()
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberAssessment)
  async updateAssessment(
    @Param('id') id: number,
    @Body() body: CreateMemberAssessmentDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.memberAssessmentService.createOrUpdate(
      id,
      body,
      requestedIp,
      currentUser.adminId,
    );
  }
}
