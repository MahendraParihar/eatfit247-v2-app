import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp } from '@server_1/core';
import { MemberAssessmentService } from '../../services';
import { IMemberAssessment } from '@eatfit247-shared-lib';
import { CreateMemberAssessmentDto } from '../../dto';

@Controller('member/:id/assessment')
@UseGuards(JwtAuthGuard)
export class MemberAssessmentController {
  constructor(private readonly memberAssessmentService: MemberAssessmentService) {}

  @Get()
  async getAssessment(@Param('id') id: number): Promise<IMemberAssessment | null> {
    return await this.memberAssessmentService.findByMemberId(id);
  }

  @Put()
  async updateAssessment(
    @Param('id') id: number,
    @Body() body: CreateMemberAssessmentDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.memberAssessmentService.createOrUpdate(
      id,
      body,
      requestedIp,
      currentUser.userId || currentUser.adminId,
    );
  }
}
