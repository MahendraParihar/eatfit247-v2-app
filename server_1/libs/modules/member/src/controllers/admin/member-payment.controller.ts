import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, RequestedIp } from '@server_1/core';
import { MemberPaymentService } from '../../services';
import {
  ICalculateTaxResponse,
  IMemberPayment,
  IMemberPaymentMasterData,
  IProgramPlan,
  ITableList,
} from '@eatfit247-shared-lib';
import { CreateMemberPaymentDto } from '../../dto';
import { CalculateTaxDto } from '../../dto/calculate-tax.dto';
import { ProgramPlanService } from '@server_1/modules/program-plan';

@Controller('member/:id/payment-history')
@UseGuards(JwtAuthGuard)
export class MemberPaymentController {
  constructor(
    private readonly memberPaymentService: MemberPaymentService,
    private readonly programPlanService: ProgramPlanService,
  ) {}

  @Get('supported-gateways')
  async getSupportedGateways(
    @Param('id') id: number,
    @Query('currency') currency: string,
  ): Promise<Array<{
    franchisePaymentGatewayId: number;
    gatewayCode: string;
    gatewayName: string;
    providerCountryCode: string;
    currencyCode: string;
    isPrimary: boolean;
    supportsDomestic: boolean;
    supportsInternational: boolean;
  }>> {
    return await this.memberPaymentService.getSupportedPaymentGateways(id, currency);
  }

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
      currentUser.adminId,
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
      currentUser.adminId,
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
      currentUser.adminId,
    );
  }

  @Get('program-plan/:programPlanId')
  async getProgramPlanDetails(
    @Param('programPlanId') programPlanId: number,
  ): Promise<IProgramPlan> {
    return await this.programPlanService.fetchById(programPlanId);
  }

  @Post('calculate-tax')
  async calculateTax(
    @Param('id') id: number,
    @Body() body: CalculateTaxDto,
  ): Promise<ICalculateTaxResponse> {
    return await this.memberPaymentService.calculateTax(
      id,
      body.orderAmount,
      body.discountAmount,
      body.isTaxApplicable,
      body.isPlanFeesIncludedTax,
      body.currencyCode,
      body.billingAddressId,
      body.addressId,
    );
  }
}
