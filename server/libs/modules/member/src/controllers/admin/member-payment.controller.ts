import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp } from '@server/common';
import { MemberPaymentService } from '../../services';
import {
  IMemberPaymentMasterData,
  ITableList,
  IMemberPayment,
  IResponse,
  IProgramPlan,
} from 'eatfit247-shared-lib';
import { CreateMemberPaymentDto } from '../../dto/member-payment.dto';
import { ProgramPlanService } from '@server/modules/program-plan';

@Controller('member/:id/payment-history')
@UseGuards(JwtAuthGuard)
export class MemberPaymentController {
  constructor(
    private readonly memberPaymentService: MemberPaymentService,
    private readonly programPlanService: ProgramPlanService,
  ) {}

  @Get('master-data')
  async getMasterData(@Param('id') id: number): Promise<IMemberPaymentMasterData> {
    return await this.memberPaymentService.loadMasterData(id);
  }

  @Get()
  async getPaymentHistory(@Param('id') id: number): Promise<ITableList<IMemberPayment>> {
    return await this.memberPaymentService.findAll(id);
  }

  @Get(':paymentId')
  async getPaymentById(
    @Param('id') id: number,
    @Param('paymentId') paymentId: number,
  ): Promise<IMemberPayment> {
    return await this.memberPaymentService.findById(id, paymentId);
  }

  @Post()
  async createPayment(
    @Param('id') id: number,
    @Body() body: CreateMemberPaymentDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<IMemberPayment> {
    body.memberId = id;
    return await this.memberPaymentService.create(
      id,
      body,
      requestedIp,
      currentUser.userId || currentUser.adminId,
    );
  }

  @Put(':paymentId')
  async updatePayment(
    @Param('id') id: number,
    @Param('paymentId') paymentId: number,
    @Body() body: CreateMemberPaymentDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<IMemberPayment> {
    body.memberId = id;
    return await this.memberPaymentService.update(
      id,
      paymentId,
      body,
      requestedIp,
      currentUser.userId || currentUser.adminId,
    );
  }

  @Delete(':paymentId')
  async deletePayment(
    @Param('id') id: number,
    @Param('paymentId') paymentId: number,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    return await this.memberPaymentService.delete(
      id,
      paymentId,
      requestedIp,
      currentUser.userId || currentUser.adminId,
    );
  }

  @Get('program-plan/:programPlanId')
  async getProgramPlanDetails(
    @Param('programPlanId') programPlanId: number,
  ): Promise<IResponse<IProgramPlan>> {
    const data = await this.programPlanService.fetchById(programPlanId);
    return { data };
  }
}
