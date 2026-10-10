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
import { Public, RequestedIp, AppConfigService } from '@server_1/core';
import { PaymentGatewayCredentialService } from '@server_1/modules/payment';
import { ConfigParam, RazorpayWebhookPayload } from '@eatfit247-shared-lib';
import { RazorpayWebhookDto } from '../../dto/razorpay-webhook.dto';
import { IRazorpayWebhookResult, RazorpayWebhookService } from '../../services/razorpay-webhook.service';
import * as crypto from 'crypto';

@Public()
@Controller('razorpay/webhook')
export class RazorpayWebhookController {
  private readonly logger = new Logger(RazorpayWebhookController.name);

  constructor(
    private readonly paymentGatewayCredentialService: PaymentGatewayCredentialService,
    private readonly appConfigService: AppConfigService,
    private readonly razorpayWebhookService: RazorpayWebhookService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: any,
    @Body() payload: RazorpayWebhookDto, // DTO validation via ValidationPipe
    @Headers('x-razorpay-signature') signature: string,
    @RequestedIp() requestedIp: string,
    @Headers('x-razorpay-event-id') eventIdHeader?: string,
  ): Promise<IRazorpayWebhookResult> {
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
    // The franchise payment gateway id in the notes selects the webhook secret
    const notes = this.extractNotes(payload);
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
    // Signature covers the raw body, so the stored and routed payload is that body,
    // not the DTO-transformed copy.
    const verifiedPayload = JSON.parse(rawBody) as RazorpayWebhookPayload;
    // Razorpay sends a stable id per event across retries; hash the body if it is missing.
    const eventId =
      eventIdHeader || crypto.createHash('sha256').update(rawBody).digest('hex');
    try {
      return await this.razorpayWebhookService.handleVerifiedEvent(
        eventId,
        verifiedPayload,
        requestedIp,
      );
    } catch (error) {
      this.logger.error(`Error processing webhook event ${payload.event}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        eventId,
      });
      throw error;
    }
  }

  /**
   * Extract notes from webhook payload
   */
  private extractNotes(payload: RazorpayWebhookDto): Record<string, any> {
    return (
      payload.payload.payment?.entity?.notes ||
      payload.payload.payment_link?.entity?.notes ||
      payload.payload.order?.entity?.notes ||
      {}
    );
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
}
