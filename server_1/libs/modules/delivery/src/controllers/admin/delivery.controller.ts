import { Body, Controller, Get, Param, Post, Put, Query, UseGuards, Req } from '@nestjs/common';
import { BasicSearchDto, CurrentUser, JwtAuthGuard, Public, RequestedIp } from '@server_1/core';
import {
  DeliveryService,
  ShipmentService,
  RateService,
  TrackingService,
  WebhookService,
} from '../../services';
import { RateRepository } from '../../repositories';
import {
  CreateShipmentDto,
  UpdateShipmentDto,
  CreateDraftShipmentDto,
  AddShipmentItemsDto,
  SelectRateDto,
} from '../../dto';
import { IAuthUser } from '@eatfit247-shared-lib';

@Controller('delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly shipmentService: ShipmentService,
    private readonly rateService: RateService,
    private readonly trackingService: TrackingService,
    private readonly webhookService: WebhookService,
    private readonly rateRepository: RateRepository,
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
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<any> {
    return await this.shipmentService.create(body, requestedIp, currentUser.adminId);
  }

  @Put('shipments/:id')
  async updateShipment(
    @Param('id') id: number,
    @Body() body: UpdateShipmentDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<any> {
    return await this.shipmentService.update(id, body, requestedIp, currentUser.adminId);
  }

  /**
   * Step 1: Create Draft Shipment
   * POST /delivery/create-draft
   */
  @Post('create-draft')
  async createDraft(
    @Body() body: CreateDraftShipmentDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<any> {
    return await this.shipmentService.createDraft(
      body.memberProductId,
      currentUser.adminId,
      requestedIp,
    );
  }

  /**
   * Step 2: Add Shipment Items
   * POST /delivery/:shipmentId/items
   */
  @Post(':shipmentId/items')
  async addItems(
    @Param('shipmentId') shipmentId: number,
    @Body() body: AddShipmentItemsDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<any> {
    return await this.shipmentService.addItems(
      shipmentId,
      body.items,
      currentUser.adminId,
      requestedIp,
    );
  }

  /**
   * Step 3: Get Rate Quotes
   * POST /delivery/:shipmentId/rates
   */
  @Post(':shipmentId/rates')
  async requestRates(
    @Param('shipmentId') shipmentId: number,
    @CurrentUser() currentUser: IAuthUser,
  ): Promise<any> {
    return await this.deliveryService.requestRates(shipmentId);
  }

  /**
   * Step 4: Select Provider Rate
   * POST /delivery/:shipmentId/select-rate
   */
  @Post(':shipmentId/select-rate')
  async selectRate(
    @Param('shipmentId') shipmentId: number,
    @Body() body: SelectRateDto,
  ): Promise<any> {
    const shipment = await this.shipmentService.findById(shipmentId);
    if (shipment.status !== 'RATE_REQUESTED') {
      throw new Error(`Shipment ${shipmentId} must have rates requested first. Current status: ${shipment.status}`);
    }
    const rateQuotes = await this.rateRepository.findByShipmentId(shipmentId);
    const selectedRate = rateQuotes.find((rq) => rq.providerId === body.providerId);
    if (!selectedRate) {
      throw new Error(`Rate quote not found for provider ${body.providerId} in shipment ${shipmentId}`);
    }
    return await this.rateService.selectRate(shipmentId, selectedRate.rateQuoteId);
  }

  /**
   * Step 5: Book Shipment
   * POST /delivery/:shipmentId/book
   */
  @Post(':shipmentId/book')
  async bookShipment(
    @Param('shipmentId') shipmentId: number,
    @CurrentUser() currentUser: IAuthUser,
  ): Promise<any> {
    return await this.deliveryService.bookShipment(shipmentId);
  }

  /**
   * Step 6: Get Tracking Information
   * GET /delivery/:shipmentId/tracking
   */
  @Get(':shipmentId/tracking')
  async getTracking(@Param('shipmentId') shipmentId: number): Promise<any> {
    return await this.trackingService.getTracking(shipmentId);
  }

  /**
   * Legacy endpoint: Get tracking information for a shipment
   * GET /delivery/:shipmentId/track
   */
  @Get(':shipmentId/track')
  async getTrackingLegacy(@Param('shipmentId') shipmentId: number): Promise<any> {
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

