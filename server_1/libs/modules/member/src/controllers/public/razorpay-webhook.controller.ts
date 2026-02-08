import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Public, RequestedIp, AppConfigService } from '@server_1/core';
import { InvoiceSequenceService } from '@server_1/platform';
import { PaymentGatewayCredentialService } from '@server_1/modules/payment';
import { FranchiseService } from '@server_1/modules/franchise';
import { TxnMemberPayment, TxnMemberProduct } from '../../models';
import { PaymentStatusEnum, ConfigParam, BusinessTypeEnum } from '@eatfit247-shared-lib';
import { RazorpayWebhookDto } from '../../dto/razorpay-webhook.dto';
import * as crypto from 'crypto';

// Keep interface for backward compatibility and type safety
interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        invoice_id: string | null;
        international: boolean;
        method: string;
        amount_refunded: number;
        refund_status: string | null;
        captured: boolean;
        description: string | null;
        card_id: string | null;
        bank: string | null;
        wallet: string | null;
        vpa: string | null;
        email: string;
        contact: string;
        notes: Record<string, any>;
        fee: number | null;
        tax: number | null;
        error_code: string | null;
        error_description: string | null;
        error_source: string | null;
        error_step: string | null;
        error_reason: string | null;
        acquirer_data: Record<string, any>;
        created_at: number;
      };
    };
    payment_link?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        description: string | null;
        customer: {
          name: string;
          email: string;
          contact: string;
        };
        status: string;
        notes: Record<string, any>;
        created_at: number;
      };
    };
    order?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        amount_paid: number;
        amount_due: number;
        currency: string;
        receipt: string;
        status: string;
        attempts: number;
        notes: Record<string, any>;
        created_at: number;
      };
    };
  };
}

@Public()
@Controller('razorpay/webhook')
export class RazorpayWebhookController {
  private readonly logger = new Logger(RazorpayWebhookController.name);
  // In-memory set to track processed webhook events (for idempotency)
  // In production, use Redis or database table for distributed systems
  private readonly processedEvents = new Set<string>();

  constructor(
    private readonly paymentGatewayCredentialService: PaymentGatewayCredentialService,
    private readonly appConfigService: AppConfigService,
    private readonly franchiseService: FranchiseService,
    private readonly invoiceSequenceService: InvoiceSequenceService,
    @InjectModel(TxnMemberPayment)
    private readonly memberPaymentRepository: typeof TxnMemberPayment,
    @InjectModel(TxnMemberProduct)
    private readonly memberProductRepository: typeof TxnMemberProduct,
    private readonly sequelize: Sequelize,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: any,
    @Body() payload: RazorpayWebhookDto, // DTO validation via ValidationPipe
    @Headers('x-razorpay-signature') signature: string,
    @RequestedIp() requestedIp: string,
  ): Promise<{ status: string; message?: string }> {
    const rawBody = req.rawBody;
    
    // Validate raw body
    if (!rawBody) {
      this.logger.warn('Webhook request missing raw body');
      throw new UnauthorizedException('Raw body not found');
    }

    // Validate signature header
    if (!signature) {
      this.logger.warn('Webhook request missing signature header');
      throw new UnauthorizedException('Razorpay signature header missing');
    }

    // Payload is already validated by ValidationPipe via DTO
    // Convert DTO to interface for backward compatibility
    const webhookPayload: RazorpayWebhookPayload = payload as any;

    // Extract order type and franchise payment gateway ID from notes
    const notes = this.extractNotes(webhookPayload);
    const orderType = this.extractOrderType(notes);
    const franchisePaymentGatewayId = this.extractFranchisePaymentGatewayId(notes);

    if (!franchisePaymentGatewayId) {
      this.logger.warn('Franchise payment gateway ID not found in webhook payload', {
        event: payload.event,
        notes,
      });
      throw new UnauthorizedException(
        'Franchise payment gateway ID not found in webhook payload',
      );
    }

    // Get and validate credentials
    const credentialMode = this.appConfigService.getString(ConfigParam.PAYMENT_MODE);
    const credentials = await this.paymentGatewayCredentialService.getActiveCredentials(
      franchisePaymentGatewayId,
      credentialMode,
    );

    if (!credentials?.webhookSecretEncrypted) {
      this.logger.error('Payment gateway credentials not found', {
        franchisePaymentGatewayId,
        credentialMode,
      });
      throw new UnauthorizedException('Payment gateway credentials not found');
    }

    // Verify webhook signature
    const isValidSignature = this.verifySignature(
      rawBody,
      signature,
      credentials.webhookSecretEncrypted,
    );

    if (!isValidSignature) {
      this.logger.warn('Invalid webhook signature', {
        event: payload.event,
        franchisePaymentGatewayId,
      });
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Idempotency check: prevent duplicate webhook processing
    const eventId = this.generateEventId(webhookPayload);
    if (this.isEventProcessed(eventId)) {
      this.logger.warn('Duplicate webhook event detected, skipping', {
        eventId,
        event: webhookPayload.event,
        orderType,
      });
      return { status: 'duplicate', message: 'Event already processed' };
    }

    // Mark event as processed
    this.markEventAsProcessed(eventId);

    // Process webhook event
    const event = webhookPayload.event;
    this.logger.log(`Processing webhook event: ${event}`, {
      eventId,
      orderType,
      franchisePaymentGatewayId,
    });

    try {
      await this.processWebhookEvent(webhookPayload, orderType, requestedIp);
      return { status: 'success' };
    } catch (error) {
      // Remove from processed events on error so it can be retried
      this.processedEvents.delete(eventId);
      this.logger.error(`Error processing webhook event ${event}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        event,
        eventId,
        orderType,
      });
      throw error;
    }
  }

  /**
   * Generate a unique event ID for idempotency checking
   */
  private generateEventId(payload: RazorpayWebhookPayload): string {
    // Use payment ID or payment link ID as unique identifier
    const paymentId = payload.payload?.payment?.entity?.id;
    const paymentLinkId = payload.payload?.payment_link?.entity?.id;
    const orderId = payload.payload?.order?.entity?.id;
    
    // Combine event type with unique identifier
    const uniqueId = paymentId || paymentLinkId || orderId || 'unknown';
    return `${payload.event}_${uniqueId}`;
  }

  /**
   * Check if event has already been processed
   */
  private isEventProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  /**
   * Mark event as processed
   * Note: In production, use Redis with TTL (e.g., 24 hours) or database table
   */
  private markEventAsProcessed(eventId: string): void {
    this.processedEvents.add(eventId);
    // Clean up old events periodically (keep last 10000 events)
    if (this.processedEvents.size > 10000) {
      const firstEvent = this.processedEvents.values().next().value;
      this.processedEvents.delete(firstEvent);
    }
  }

  /**
   * Extract notes from webhook payload
   */
  private extractNotes(payload: RazorpayWebhookPayload): Record<string, any> {
    return (
      payload.payload?.payment?.entity?.notes ||
      payload.payload?.payment_link?.entity?.notes ||
      payload.payload?.order?.entity?.notes ||
      {}
    );
  }

  /**
   * Extract order type from notes
   */
  private extractOrderType(notes: Record<string, any>): 'plan' | 'product' | null {
    const type = notes['type'];
    return type === 'plan' || type === 'product' ? type : null;
  }

  /**
   * Extract franchise payment gateway ID from notes
   */
  private extractFranchisePaymentGatewayId(notes: Record<string, any>): number | null {
    const id = notes['franchisePaymentGatewayId'];
    if (!id) return null;
    const parsed = parseInt(String(id), 10);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Verify webhook signature using timing-safe comparison
   */
  private verifySignature(
    rawBody: string,
    signature: string,
    webhookSecret: string,
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');
      
      // Use timing-safe comparison to prevent timing attacks
      if (expectedSignature.length !== signature.length) {
        return false;
      }
      
      // Convert hex strings to buffers for timing-safe comparison
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      const signatureBuffer = Buffer.from(signature, 'hex');
      
      return crypto.timingSafeEqual(
        new Uint8Array(expectedBuffer),
        new Uint8Array(signatureBuffer),
      );
    } catch (error) {
      this.logger.error('Error verifying signature', error);
      return false;
    }
  }

  /**
   * Process webhook event based on event type
   */
  private async processWebhookEvent(
    payload: RazorpayWebhookPayload,
    orderType: 'plan' | 'product' | null,
    requestedIp: string,
  ): Promise<void> {
    const event = payload.event;

    switch (event) {
      case 'payment.captured':
        await this.handlePaymentCaptured(payload, orderType, requestedIp);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(payload, orderType, requestedIp);
        break;
      case 'payment_link.paid':
        await this.handlePaymentLinkPaid(payload, orderType, requestedIp);
        break;
      case 'order.paid':
        await this.handleOrderPaid(payload, orderType, requestedIp);
        break;
      case 'payment.refunded':
        await this.handlePaymentRefunded(payload, orderType, requestedIp);
        break;
      case 'refund.created':
        await this.handleRefundCreated(payload, orderType, requestedIp);
        break;
      default:
        this.logger.warn(`Unhandled webhook event: ${event}`, { event });
    }
  }

  /**
   * Handle payment captured event
   */
  private async handlePaymentCaptured(
    payload: RazorpayWebhookPayload,
    orderType: 'plan' | 'product' | null,
    requestedIp: string,
  ): Promise<void> {
    const payment = payload.payload?.payment?.entity;
    if (!payment?.order_id) {
      throw new Error('Payment entity or order_id not found in payload');
    }

    // Verify amount and currency before processing
    if (orderType === 'plan') {
      const order = await this.memberPaymentRepository.findOne({
        where: { gatewayOrderId: payment.order_id },
      });

      if (!order) {
        throw new Error(`Plan payment order not found for gateway order ID: ${payment.order_id}`);
      }

      // Verify payment amount (Razorpay sends amount in paise, convert to rupees)
      const razorpayAmountInRupees = payment.amount / 100;
      const expectedAmount = Number(order.totalAmount || 0);
      
      // Allow small rounding differences (1 paise tolerance)
      if (Math.abs(razorpayAmountInRupees - expectedAmount) > 0.01) {
        this.logger.error('Payment amount mismatch for plan payment', {
          expected: expectedAmount,
          received: razorpayAmountInRupees,
          orderId: payment.order_id,
          memberPaymentId: order.memberPaymentId,
        });
        throw new Error(
          `Payment amount verification failed. Expected: ${expectedAmount}, Received: ${razorpayAmountInRupees}`,
        );
      }

      // Verify currency
      const expectedCurrency = (order as any).currency || 'INR';
      if (payment.currency !== expectedCurrency.toUpperCase()) {
        this.logger.error('Payment currency mismatch for plan payment', {
          expected: expectedCurrency,
          received: payment.currency,
          orderId: payment.order_id,
        });
        throw new Error(
          `Payment currency verification failed. Expected: ${expectedCurrency}, Received: ${payment.currency}`,
        );
      }

      await this.updatePlanPayment(
        payment.order_id,
        {
          paymentStatusId: PaymentStatusEnum.PAID,
          gatewayPaymentId: payment.id,
          transactionId: payment.id,
          paymentDate: new Date(payment.created_at * 1000),
          paymentGatewayResponse: payment,
          modifiedIp: requestedIp,
        },
        true,
      );
    } else if (orderType === 'product') {
      const order = await this.memberProductRepository.findOne({
        where: { gatewayOrderId: payment.order_id },
      });

      if (!order) {
        throw new Error(`Product order not found for gateway order ID: ${payment.order_id}`);
      }

      // Verify payment amount (Razorpay sends amount in paise, convert to rupees)
      const razorpayAmountInRupees = payment.amount / 100;
      const expectedAmount = Number(order.totalAmount || 0);
      
      // Allow small rounding differences (1 paise tolerance)
      if (Math.abs(razorpayAmountInRupees - expectedAmount) > 0.01) {
        this.logger.error('Payment amount mismatch for product order', {
          expected: expectedAmount,
          received: razorpayAmountInRupees,
          orderId: payment.order_id,
          memberProductId: order.memberProductId,
        });
        throw new Error(
          `Payment amount verification failed. Expected: ${expectedAmount}, Received: ${razorpayAmountInRupees}`,
        );
      }

      // Verify currency
      const expectedCurrency = order.currency || 'INR';
      if (payment.currency !== expectedCurrency.toUpperCase()) {
        this.logger.error('Payment currency mismatch for product order', {
          expected: expectedCurrency,
          received: payment.currency,
          orderId: payment.order_id,
        });
        throw new Error(
          `Payment currency verification failed. Expected: ${expectedCurrency}, Received: ${payment.currency}`,
        );
      }

      await this.updateProductOrder(
        payment.order_id,
        {
          paymentStatusId: PaymentStatusEnum.PAID,
          gatewayPaymentId: payment.id,
          transactionId: payment.id,
          paymentDate: new Date(payment.created_at * 1000),
          paymentGatewayResponse: payment,
          modifiedIp: requestedIp,
        },
        true,
      );
    } else {
      this.logger.warn('Order type not found for payment.captured event', {
        orderId: payment.order_id,
      });
    }
  }

  /**
   * Handle payment failed event
   */
  private async handlePaymentFailed(
    payload: RazorpayWebhookPayload,
    orderType: 'plan' | 'product' | null,
    requestedIp: string,
  ): Promise<void> {
    const payment = payload.payload?.payment?.entity;
    if (!payment?.order_id) {
      throw new Error('Payment entity or order_id not found in payload');
    }

    if (orderType === 'plan') {
      await this.updatePlanPayment(
        payment.order_id,
        {
          paymentStatusId: PaymentStatusEnum.FAILED,
          gatewayPaymentId: payment.id,
          paymentGatewayResponse: payment,
          modifiedIp: requestedIp,
        },
        false,
      );
    } else if (orderType === 'product') {
      await this.updateProductOrder(
        payment.order_id,
        {
          paymentStatusId: PaymentStatusEnum.FAILED,
          gatewayPaymentId: payment.id,
          paymentGatewayResponse: payment,
          modifiedIp: requestedIp,
        },
        false,
      );
    } else {
      this.logger.warn('Order type not found for payment.failed event', {
        orderId: payment.order_id,
      });
    }
  }

  /**
   * Handle payment link paid event
   */
  private async handlePaymentLinkPaid(
    payload: RazorpayWebhookPayload,
    orderType: 'plan' | 'product' | null,
    requestedIp: string,
  ): Promise<void> {
    const paymentLink = payload.payload?.payment_link?.entity;
    if (!paymentLink?.id) {
      throw new Error('Payment link entity or id not found in payload');
    }

    // Extract payment entity from payload (payment_link.paid includes payment entity)
    const payment = payload.payload?.payment?.entity;
    const paymentId = payment?.id || null;

    if (orderType === 'plan') {
      await this.updatePlanPaymentByPaymentLink(
        paymentLink.id,
        {
          paymentStatusId: PaymentStatusEnum.PAID,
          gatewayPaymentId: paymentId,
          transactionId: paymentId,
          paymentDate: new Date(paymentLink.created_at * 1000),
          paymentGatewayResponse: payment || paymentLink,
          modifiedIp: requestedIp,
        },
        true,
      );
    } else if (orderType === 'product') {
      await this.updateProductOrderByPaymentLink(
        paymentLink.id,
        {
          paymentStatusId: PaymentStatusEnum.PAID,
          gatewayPaymentId: paymentId,
          transactionId: paymentId,
          paymentDate: new Date(paymentLink.created_at * 1000),
          paymentGatewayResponse: payment || paymentLink,
          modifiedIp: requestedIp,
        },
        true,
      );
    } else {
      this.logger.warn('Order type not found for payment_link.paid event', {
        paymentLinkId: paymentLink.id,
      });
    }
  }

  /**
   * Handle order paid event
   */
  private async handleOrderPaid(
    payload: RazorpayWebhookPayload,
    orderType: 'plan' | 'product' | null,
    requestedIp: string,
  ): Promise<void> {
    // Order.paid is similar to payment.captured, delegate to that handler
    await this.handlePaymentCaptured(payload, orderType, requestedIp);
  }

  /**
   * Update plan payment with transaction support
   */
  private async updatePlanPayment(
    gatewayOrderId: string,
    updateData: {
      paymentStatusId: PaymentStatusEnum;
      gatewayPaymentId?: string;
      transactionId?: string;
      paymentDate?: Date;
      paymentGatewayResponse?: any;
      modifiedIp: string;
    },
    generateInvoice: boolean,
  ): Promise<void> {
    const transaction = await this.sequelize.transaction();
    try {
      const paymentRecord = await this.memberPaymentRepository.findOne({
        where: { gatewayOrderId },
        transaction,
      });

      if (!paymentRecord) {
        this.logger.warn('Payment record not found for gateway order ID', {
          gatewayOrderId,
        });
        await transaction.rollback();
        return;
      }

      // Idempotency check: only update if status is PENDING or if already PAID (allow re-processing)
      if (
        paymentRecord.paymentStatusId === PaymentStatusEnum.PAID &&
        updateData.paymentStatusId === PaymentStatusEnum.PAID
      ) {
        this.logger.log('Payment already processed, skipping update', {
          gatewayOrderId,
          memberPaymentId: paymentRecord.memberPaymentId,
        });
        await transaction.rollback();
        return;
      }

      // Update payment record
      Object.assign(paymentRecord, updateData);
      await paymentRecord.save({ transaction });

      // Generate invoice if needed
      if (generateInvoice && !paymentRecord.invoiceId && paymentRecord.franchiseId) {
        await this.generateInvoiceForPlan(paymentRecord, transaction);
      }

      await transaction.commit();
      this.logger.log('Plan payment updated successfully', {
        gatewayOrderId,
        memberPaymentId: paymentRecord.memberPaymentId,
        paymentStatusId: updateData.paymentStatusId,
      });
    } catch (error) {
      await transaction.rollback();
      this.logger.error('Error updating plan payment', {
        error: error instanceof Error ? error.message : String(error),
        gatewayOrderId,
      });
      throw error;
    }
  }

  /**
   * Update product order with transaction support
   */
  private async updateProductOrder(
    gatewayOrderId: string,
    updateData: {
      paymentStatusId: PaymentStatusEnum;
      gatewayPaymentId?: string;
      transactionId?: string;
      paymentDate?: Date;
      paymentGatewayResponse?: any;
      modifiedIp: string;
    },
    generateInvoice: boolean,
  ): Promise<void> {
    const transaction = await this.sequelize.transaction();
    try {
      const productOrder = await this.memberProductRepository.findOne({
        where: { gatewayOrderId },
        transaction,
      });

      if (!productOrder) {
        this.logger.warn('Product order not found for gateway order ID', {
          gatewayOrderId,
        });
        await transaction.rollback();
        return;
      }

      // Idempotency check
      if (
        productOrder.paymentStatusId === PaymentStatusEnum.PAID &&
        updateData.paymentStatusId === PaymentStatusEnum.PAID
      ) {
        this.logger.log('Product order already processed, skipping update', {
          gatewayOrderId,
          memberProductId: productOrder.memberProductId,
        });
        await transaction.rollback();
        return;
      }

      // Update product order
      Object.assign(productOrder, updateData);
      await productOrder.save({ transaction });

      // Generate invoice if needed
      if (generateInvoice && !productOrder.invoiceId && productOrder.franchiseId) {
        await this.generateInvoiceForProduct(productOrder, transaction);
      }

      await transaction.commit();
      this.logger.log('Product order updated successfully', {
        gatewayOrderId,
        memberProductId: productOrder.memberProductId,
        paymentStatusId: updateData.paymentStatusId,
      });
    } catch (error) {
      await transaction.rollback();
      this.logger.error('Error updating product order', {
        error: error instanceof Error ? error.message : String(error),
        gatewayOrderId,
      });
      throw error;
    }
  }

  /**
   * Update plan payment by payment link ID
   */
  private async updatePlanPaymentByPaymentLink(
    paymentLinkId: string,
    updateData: {
      paymentStatusId: PaymentStatusEnum;
      gatewayPaymentId?: string;
      transactionId?: string;
      paymentDate?: Date;
      paymentGatewayResponse?: any;
      modifiedIp: string;
    },
    generateInvoice: boolean,
  ): Promise<void> {
    const transaction = await this.sequelize.transaction();
    try {
      const paymentRecord = await this.memberPaymentRepository.findOne({
        where: { gatewayOrderId: paymentLinkId },
        transaction,
      });

      if (!paymentRecord) {
        this.logger.warn('Payment record not found for payment link ID', {
          paymentLinkId,
        });
        await transaction.rollback();
        return;
      }

      // Only update if the status is PENDING (idempotency)
      if (paymentRecord.paymentStatusId !== PaymentStatusEnum.PENDING) {
        this.logger.log('Payment record not in PENDING status, skipping update', {
          paymentLinkId,
          currentStatus: paymentRecord.paymentStatusId,
        });
        await transaction.rollback();
        return;
      }

      // Update payment record
      Object.assign(paymentRecord, updateData);
      await paymentRecord.save({ transaction });

      // Generate invoice if needed
      if (generateInvoice && !paymentRecord.invoiceId && paymentRecord.franchiseId) {
        await this.generateInvoiceForPlan(paymentRecord, transaction);
      }

      await transaction.commit();
      this.logger.log('Plan payment updated by payment link successfully', {
        paymentLinkId,
        memberPaymentId: paymentRecord.memberPaymentId,
      });
    } catch (error) {
      await transaction.rollback();
      this.logger.error('Error updating plan payment by payment link', {
        error: error instanceof Error ? error.message : String(error),
        paymentLinkId,
      });
      throw error;
    }
  }

  /**
   * Update product order by payment link ID
   */
  private async updateProductOrderByPaymentLink(
    paymentLinkId: string,
    updateData: {
      paymentStatusId: PaymentStatusEnum;
      gatewayPaymentId?: string;
      transactionId?: string;
      paymentDate?: Date;
      paymentGatewayResponse?: any;
      modifiedIp: string;
    },
    generateInvoice: boolean,
  ): Promise<void> {
    const transaction = await this.sequelize.transaction();
    try {
      const productOrder = await this.memberProductRepository.findOne({
        where: { gatewayOrderId: paymentLinkId },
        transaction,
      });

      if (!productOrder) {
        this.logger.warn('Product order not found for payment link ID', {
          paymentLinkId,
        });
        await transaction.rollback();
        return;
      }

      // Only update if the status is PENDING (idempotency)
      if (productOrder.paymentStatusId !== PaymentStatusEnum.PENDING) {
        this.logger.log('Product order not in PENDING status, skipping update', {
          paymentLinkId,
          currentStatus: productOrder.paymentStatusId,
        });
        await transaction.rollback();
        return;
      }

      // Update product order
      Object.assign(productOrder, updateData);
      await productOrder.save({ transaction });

      // Generate invoice if needed
      if (generateInvoice && !productOrder.invoiceId && productOrder.franchiseId) {
        await this.generateInvoiceForProduct(productOrder, transaction);
      }

      await transaction.commit();
      this.logger.log('Product order updated by payment link successfully', {
        paymentLinkId,
        memberProductId: productOrder.memberProductId,
      });
    } catch (error) {
      await transaction.rollback();
      this.logger.error('Error updating product order by payment link', {
        error: error instanceof Error ? error.message : String(error),
        paymentLinkId,
      });
      throw error;
    }
  }

  /**
   * Generate invoice for plan payment
   */
  private async generateInvoiceForPlan(
    paymentRecord: TxnMemberPayment,
    transaction: any,
  ): Promise<void> {
    try {
      const franchiseDetails = await this.franchiseService.fetchById(
        paymentRecord.franchiseId,
      );
      const invoiceNumber = await this.invoiceSequenceService.generateInvoiceNumber(
        paymentRecord.franchiseId,
        franchiseDetails.financialYear,
        franchiseDetails.franchiseCode,
        BusinessTypeEnum.SERVICE,
        transaction,
      );
      paymentRecord.invoiceId = invoiceNumber;
      await paymentRecord.save({ transaction });
      this.logger.log('Invoice generated for plan payment', {
        memberPaymentId: paymentRecord.memberPaymentId,
        invoiceId: invoiceNumber,
      });
    } catch (error) {
      this.logger.error('Error generating invoice for plan payment', {
        error: error instanceof Error ? error.message : String(error),
        memberPaymentId: paymentRecord.memberPaymentId,
      });
      throw error;
    }
  }

  /**
   * Generate invoice for product order
   */
  private async generateInvoiceForProduct(
    productOrder: TxnMemberProduct,
    transaction: any,
  ): Promise<void> {
    try {
      const franchiseDetails = await this.franchiseService.fetchById(
        productOrder.franchiseId,
      );
      const invoiceNumber = await this.invoiceSequenceService.generateInvoiceNumber(
        productOrder.franchiseId,
        franchiseDetails.financialYear,
        franchiseDetails.franchiseCode,
        BusinessTypeEnum.PRODUCT,
        transaction,
      );
      productOrder.invoiceId = invoiceNumber;
      await productOrder.save({ transaction });
      this.logger.log('Invoice generated for product order', {
        memberProductId: productOrder.memberProductId,
        invoiceId: invoiceNumber,
      });
    } catch (error) {
      this.logger.error('Error generating invoice for product order', {
        error: error instanceof Error ? error.message : String(error),
        memberProductId: productOrder.memberProductId,
      });
      throw error;
    }
  }

  /**
   * Handle payment refunded event
   */
  private async handlePaymentRefunded(
    payload: RazorpayWebhookPayload,
    orderType: 'plan' | 'product' | null,
    requestedIp: string,
  ): Promise<void> {
    const payment = payload.payload?.payment?.entity;
    if (!payment?.order_id) {
      throw new Error('Payment entity or order_id not found in payload');
    }

    this.logger.log('Processing payment refunded event', {
      paymentId: payment.id,
      orderId: payment.order_id,
      refundStatus: payment.refund_status,
      amountRefunded: payment.amount_refunded,
    });

    // Update payment record with refund information
    if (orderType === 'plan') {
      const order = await this.memberPaymentRepository.findOne({
        where: { gatewayOrderId: payment.order_id },
      });

      if (order) {
        const refundObj = {
          refundStatus: payment.refund_status,
          amountRefunded: payment.amount_refunded / 100, // Convert from paise to rupees
          refundedAt: new Date(),
        };

        await this.memberPaymentRepository.update(
          {
            refundObj: refundObj,
            modifiedIp: requestedIp,
          },
          {
            where: { gatewayOrderId: payment.order_id },
          },
        );

        this.logger.log('Plan payment refund updated', {
          memberPaymentId: order.memberPaymentId,
          refundAmount: refundObj.amountRefunded,
        });
      }
    } else if (orderType === 'product') {
      const order = await this.memberProductRepository.findOne({
        where: { gatewayOrderId: payment.order_id },
      });

      if (order) {
        const refundObj = {
          refundStatus: payment.refund_status,
          amountRefunded: payment.amount_refunded / 100, // Convert from paise to rupees
          refundedAt: new Date(),
        };

        await this.memberProductRepository.update(
          {
            refundObj: refundObj,
            modifiedIp: requestedIp,
          },
          {
            where: { gatewayOrderId: payment.order_id },
          },
        );

        this.logger.log('Product order refund updated', {
          memberProductId: order.memberProductId,
          refundAmount: refundObj.amountRefunded,
        });
      }
    }
  }

  /**
   * Handle refund created event
   */
  private async handleRefundCreated(
    payload: RazorpayWebhookPayload,
    orderType: 'plan' | 'product' | null,
    requestedIp: string,
  ): Promise<void> {
    // Refund created event is similar to payment.refunded
    // Delegate to handlePaymentRefunded
    await this.handlePaymentRefunded(payload, orderType, requestedIp);
  }
}

