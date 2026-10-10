import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Public, RequestedIp, AppConfigService } from '@server_1/core';
import { PaymentGatewayCredentialService } from '@server_1/modules/payment';
import { ConfigParam, RazorpayWebhookPayload } from '@eatfit247-shared-lib';
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
    // The signed raw body is the payload. It is deliberately not validated against a field
    // whitelist: Razorpay adds fields over time, and a strict DTO turned real events into 400s.
    @Req() req: { rawBody?: string | null },
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
    // Parsed before verification only to find the gateway (its secret checks the signature)
    const payload = this.parsePayload(rawBody);
    // The franchise payment gateway id in the notes selects the webhook secret
    const notes = this.extractNotes(payload);
    // No notes with the gateway (e.g. empty notes on a payment): use the gateway stored on the
    // record for this order or link. The signature below is still checked with its secret.
    const franchisePaymentGatewayId =
      this.extractFranchisePaymentGatewayId(notes) ?? (await this.razorpayWebhookService.findStoredGatewayId(payload));
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
    const verifiedPayload = payload;
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
      if (error instanceof ConflictException) {
        this.logger.warn(`Webhook event ${eventId} is still being processed; asked the gateway to retry`);
        throw error;
      }
      this.logger.error(`Error processing webhook event ${payload.event}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        eventId,
      });
      throw error;
    }
  }

  /** Minimal shape check of the raw body (event name and payload object). */
  private parsePayload(rawBody: string): RazorpayWebhookPayload {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException('Webhook body is not valid JSON');
    }
    const candidate = parsed as Partial<RazorpayWebhookPayload> | null;
    if (!candidate || typeof candidate.event !== 'string' || typeof candidate.payload !== 'object' || !candidate.payload) {
      throw new BadRequestException('Webhook body is not a Razorpay event');
    }
    return candidate as RazorpayWebhookPayload;
  }

  /**
   * The notes object that carries the gateway id. Razorpay sends empty notes as `[]` (truthy),
   * so each candidate must be a plain object that actually has the key; payment-link events
   * look at the link's notes first.
   */
  private extractNotes(payload: RazorpayWebhookPayload): Record<string, unknown> {
    const fromLink = payload.payload.payment_link?.entity?.notes;
    const fromPayment = payload.payload.payment?.entity?.notes;
    const fromOrder = payload.payload.order?.entity?.notes;
    const candidates = payload.event.startsWith('payment_link.')
      ? [fromLink, fromPayment, fromOrder]
      : [fromPayment, fromOrder, fromLink];
    const notes = candidates.find(
      (candidate): candidate is Record<string, unknown> =>
        !!candidate && typeof candidate === 'object' && !Array.isArray(candidate) && 'franchisePaymentGatewayId' in candidate,
    );
    return notes ?? {};
  }

  /**
   * Extract franchise payment gateway ID from notes
   */
  private extractFranchisePaymentGatewayId(notes: Record<string, unknown>): number | null {
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
