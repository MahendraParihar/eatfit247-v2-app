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
  BookShipmentDto,
  IBaseWebhookPayload,
  IWebhookHandleResult,
  IWebhookHeaders,
} from '../../dto';
import { BadRequestException } from '@nestjs/common';
import {
  IAuthUser,
  IRateQuote,
  IShipment,
  ITableList,
  ITrackingInfo,
} from '@eatfit247-shared-lib';

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
  async listShipments(@Query() req: BasicSearchDto): Promise<ITableList<IShipment>> {
    return await this.shipmentService.findAll(req);
  }

  @Get('shipments/:id')
  async getShipmentById(@Param('id') id: number): Promise<IShipment> {
    return await this.shipmentService.findById(id);
  }

  @Post('shipments')
  async createShipment(
    @Body() body: CreateShipmentDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<IShipment> {
    return await this.shipmentService.create(body, requestedIp, currentUser.adminId);
  }

  @Put('shipments/:id')
  async updateShipment(
    @Param('id') id: number,
    @Body() body: UpdateShipmentDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<IShipment> {
    return await this.shipmentService.update(id, body, requestedIp, currentUser.adminId);
  }

  /**
   * Step 1: Create Draft Shipment (with optional items in one call)
   * POST /delivery/create-draft
   * When items are provided, creates draft and adds items in a single transaction.
   */
  @Post('create-draft')
  async createDraft(
    @Body() body: CreateDraftShipmentDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<IShipment> {
    return await this.shipmentService.createDraft(
      body.memberProductId,
      currentUser.adminId,
      requestedIp,
      body.items,
    );
  }

  /**
   * Step 2: Add items to draft shipment (full quantity per order item only)
   * POST /delivery/:shipmentId/items
   */
  @Post(':shipmentId/items')
  async addItems(
    @Param('shipmentId') shipmentId: number,
    @Body() body: AddShipmentItemsDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<IShipment> {
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
  async requestRates(@Param('shipmentId') shipmentId: number): Promise<IRateQuote[]> {
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
  ): Promise<IShipment> {
    const shipment = await this.shipmentService.findById(shipmentId);
    if (shipment.status !== 'RATE_REQUESTED') {
      throw new BadRequestException(
        `Shipment ${shipmentId} must have rates requested first. Current status: ${shipment.status}`,
      );
    }
    let rateQuoteId: number;
    if (body.rateQuoteId != null) {
      const rateQuotes = await this.rateRepository.findByShipmentId(shipmentId);
      const found = rateQuotes.find((rq) => Number(rq.rateQuoteId) === Number(body.rateQuoteId));
      if (!found) {
        throw new BadRequestException(
          `Rate quote ${body.rateQuoteId} not found for shipment ${shipmentId}`,
        );
      }
      rateQuoteId = body.rateQuoteId;
    } else if (body.providerId != null) {
      const rateQuotes = await this.rateRepository.findByShipmentId(shipmentId);
      const selectedRate = rateQuotes.find((rq) => rq.providerId === body.providerId);
      if (!selectedRate) {
        throw new BadRequestException(
          `Rate quote not found for provider ${body.providerId} in shipment ${shipmentId}`,
        );
      }
      rateQuoteId = selectedRate.rateQuoteId;
    } else {
      throw new BadRequestException('Either rateQuoteId or providerId is required');
    }
    await this.rateService.selectRate(shipmentId, rateQuoteId);
    return this.shipmentService.findById(shipmentId);
  }

  /**
   * Step 5: Book Shipment (select rate + book in one call when rateQuoteId provided)
   * POST /delivery/:shipmentId/book
   * When rateQuoteId or providerId is provided and shipment is RATE_REQUESTED, selects rate first then books.
   */
  @Post(':shipmentId/book')
  async bookShipment(
    @Param('shipmentId') shipmentId: number,
    @Body() body: BookShipmentDto,
  ): Promise<IShipment> {
    await this.deliveryService.bookShipment(shipmentId, body);
    return this.shipmentService.findById(shipmentId);
  }

  /**
   * Step 6: Get Tracking Information
   * GET /delivery/:shipmentId/tracking
   */
  @Get(':shipmentId/tracking')
  async getTracking(@Param('shipmentId') shipmentId: number): Promise<ITrackingInfo> {
    return await this.trackingService.getTracking(shipmentId);
  }

  /**
   * Legacy endpoint: Get tracking information for a shipment
   * GET /delivery/:shipmentId/track
   */
  @Get(':shipmentId/track')
  async getTrackingLegacy(@Param('shipmentId') shipmentId: number): Promise<ITrackingInfo> {
    return await this.trackingService.getTracking(shipmentId);
  }

  /**
   * Public Endpoint: Handle webhook from courier provider
   * POST /delivery/webhook/:provider
   * Supports: NIMBUS, SHIPROCKET
   * This endpoint is public (no auth required) as it receives webhooks from external courier providers
   */
  @Public()
  @Post('webhook/:provider')
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() body: IBaseWebhookPayload,
    @Req() req: { headers: IWebhookHeaders },
  ): Promise<IWebhookHandleResult> {
    return await this.webhookService.handleWebhook(provider, body, req.headers);
  }
}
