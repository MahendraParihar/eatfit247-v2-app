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
import { MemberPlanService } from '../../services';
import {
  ICalculateTaxResponse,
  IMemberPayment,
  IMemberPaymentMasterData,
  IPaymentLinkResponse,
  IProgramPlan,
  ITableList,
} from '@eatfit247-shared-lib';
import {
  CreateMemberPaymentDto,
  CreatePaymentLinkDto,
  PlanTaxCalculationRequestDto,
} from '../../dto';
import { ProgramPlanService } from '@server_1/modules/program-plan';
import { IFileModel } from '@server_1/platform';

@Controller('member/:id/payment-history')
@UseGuards(JwtAuthGuard)
export class MemberPlanController {
  constructor(
    private readonly memberPaymentService: MemberPlanService,
    private readonly programPlanService: ProgramPlanService,
  ) {}

  @Get('supported-gateways')
  async getSupportedGateways(
    @Param('id') id: number,
    @Query('currency') currency: string,
  ): Promise<
    Array<{
      franchisePaymentGatewayId: number;
      gatewayCode: string;
      gatewayName: string;
      providerCountryCode: string;
      currencyCode: string;
      isPrimary: boolean;
      supportsDomestic: boolean;
      supportsInternational: boolean;
    }>
  > {
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
    return await this.memberPaymentService.create(id, body, requestedIp, currentUser.adminId);
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
    @Body() body: PlanTaxCalculationRequestDto,
  ): Promise<ICalculateTaxResponse> {
    return await this.memberPaymentService.calculateTax(id, body);
  }

  @Post('create-payment-link')
  async createPaymentLink(
    @Param('id') id: number,
    @Body() body: CreatePaymentLinkDto,
  ): Promise<IPaymentLinkResponse> {
    return await this.memberPaymentService.createPaymentLink(id, body);
  }

  @Post(':paymentId/regenerate-payment-link')
  async regeneratePaymentLink(
    @Param('id') id: number,
    @Param('paymentId') paymentId: number,
  ): Promise<IMemberPayment> {
    return await this.memberPaymentService.regeneratePaymentLink(id, paymentId);
  }

  @Get(':paymentId/invoice')
  @Header('Content-Type', 'application/pdf')
  async downloadInvoice(
    @Param('id') id: number,
    @Param('paymentId') paymentId: number,
  ): Promise<IFileModel> {
    return await this.memberPaymentService.generateInvoicePDF(id, paymentId);
  }
}
