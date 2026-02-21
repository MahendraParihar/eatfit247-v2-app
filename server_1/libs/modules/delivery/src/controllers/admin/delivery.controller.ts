import { Body, Controller, Get, Param, Post, Put, Query, UseGuards, Req } from '@nestjs/common';
import { BasicSearchDto, CurrentUser, JwtAuthGuard, Public, RequestedIp } from '@server_1/core';
import {
  DeliveryService,
  ShipmentService,
  RateService,
  TrackingService,
  WebhookService,
} from '../../services';
import { CreateShipmentDto, UpdateShipmentDto } from '../../dto';

@Controller('delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly shipmentService: ShipmentService,
    private readonly rateService: RateService,
    private readonly trackingService: TrackingService,
    private readonly webhookService: WebhookService,
  ) {}

  @Get('shipments/list')
  async listShipments(@Query() req: BasicSearchDto): Promise<any> {
    return await this.shipmentService.findAll(req);
  }

  @Get('shipments/:id')
  async getShipmentById(@Param('id') id: number): Promise<any> {
    return await this.shipmentService.findById(id);
  }

  @Post('shipments')
  async createShipment(
    @Body() body: CreateShipmentDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<any> {
    return await this.shipmentService.create(body, requestedIp, currentUser.adminId);
  }

  @Put('shipments/:id')
  async updateShipment(
    @Param('id') id: number,
    @Body() body: UpdateShipmentDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<any> {
    return await this.shipmentService.update(id, body, requestedIp, currentUser.adminId);
  }

  /**
   * Admin Endpoint: Request rates for a shipment
   * POST /delivery/:shipmentId/rates
   */
  @Post(':shipmentId/rates')
  async requestRates(
    @Param('shipmentId') shipmentId: number,
    @CurrentUser() currentUser: any,
  ): Promise<any> {
    return await this.deliveryService.requestRates(shipmentId);
  }

  @Post('shipments/:id/select-rate')
  async selectRate(
    @Param('id') id: number,
    @Body() body: { rateQuoteId: number },
  ): Promise<any> {
    return await this.rateService.selectRate(id, body.rateQuoteId);
  }

  /**
   * Admin Endpoint: Book a shipment
   * POST /delivery/:shipmentId/book
   */
  @Post(':shipmentId/book')
  async bookShipment(
    @Param('shipmentId') shipmentId: number,
    @CurrentUser() currentUser: any,
  ): Promise<any> {
    return await this.deliveryService.bookShipment(shipmentId);
  }

  /**
   * Admin Endpoint: Get tracking information for a shipment
   * GET /delivery/:shipmentId/track
   */
  @Get(':shipmentId/track')
  async getTracking(@Param('shipmentId') shipmentId: number): Promise<any> {
    return await this.trackingService.getTracking(shipmentId);
  }

  /**
   * Public Endpoint: Handle webhook from courier provider
   * POST /delivery/webhook/:provider
   * This endpoint is public (no auth required) as it receives webhooks from external courier providers
   */
  @Public()
  @Post('webhook/:provider')
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() body: any,
    @Req() req: any,
  ): Promise<any> {
    return await this.webhookService.handleWebhook(provider, body, req.headers);
  }
}

