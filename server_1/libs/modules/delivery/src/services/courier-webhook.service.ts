import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ITrackingEvent } from '@eatfit247-shared-lib';
import {
  MstCourierProvider,
  TxnCourierProviderAccount,
  TxnCourierWebhookLog,
  TxnShipment,
} from '../models';
import { ShipmentRecordService } from './shipment-record.service';
import { WebhookStrategyFactory } from '../providers/webhook-strategies/webhook-strategy.factory';
import { IWebhookEventData } from '../providers/webhook-strategies/webhook-strategy.interface';

export interface ICourierWebhookInput {
  providerCode: string;
  rawBody: string;
  headers: Record<string, string | string[] | undefined>;
  body: Record<string, unknown>;
}

export interface ICourierWebhookResult {
  accepted: boolean;
  message: string;
  shipmentId?: number;
}

@Injectable()
export class CourierWebhookService {
  private readonly logger = new Logger(CourierWebhookService.name);

  constructor(
    @InjectModel(MstCourierProvider)
    private readonly providerRepository: typeof MstCourierProvider,
    @InjectModel(TxnCourierProviderAccount)
    private readonly providerAccountRepository: typeof TxnCourierProviderAccount,
    @InjectModel(TxnCourierWebhookLog)
    private readonly webhookLogRepository: typeof TxnCourierWebhookLog,
    @InjectModel(TxnShipment)
    private readonly shipmentRepository: typeof TxnShipment,
    private readonly shipmentRecordService: ShipmentRecordService,
    private readonly strategyFactory: WebhookStrategyFactory,
  ) {}

  async process(input: ICourierWebhookInput): Promise<ICourierWebhookResult> {
    const provider = await this.providerRepository.findOne({
      where: { providerCode: input.providerCode.toUpperCase(), active: true },
    });

    if (!provider) {
      await this.persistLog(null, null, input, false, 'Unknown provider code');
      return { accepted: false, message: 'Unknown provider' };
    }

    // Strategy may throw BadRequestException if providerCode is unsupported in the factory.
    // That's a 400 to the caller, which is appropriate — Nimbus/Shiprocket/Shipway will retry only
    // on 5xx, and the URL is wrong if we reach here.
    const strategy = this.strategyFactory.getStrategy(provider.providerCode);
    const extracted = strategy.extractEvent(input.body);

    const shipment = extracted.awbNumber
      ? await this.shipmentRepository.findOne({ where: { trackingNumber: extracted.awbNumber } })
      : null;

    const providerAccount = shipment
      ? await this.providerAccountRepository.findByPk(shipment.providerAccountId)
      : await this.providerAccountRepository.findOne({
          where: { courierProviderId: provider.courierProviderId, active: true },
        });

    const sigCheck = strategy.verifyAuth(input, providerAccount?.webhookSecret ?? null);
    const log = await this.persistLog(
      provider.courierProviderId,
      providerAccount?.providerAccountId ?? null,
      input,
      sigCheck.valid,
      sigCheck.valid ? null : sigCheck.reason,
    );

    if (!sigCheck.valid) {
      return { accepted: false, message: sigCheck.reason };
    }

    if (!extracted.awbNumber) {
      await this.markProcessed(log.webhookLogId, 'No AWB in payload');
      return { accepted: true, message: 'No AWB in payload — logged only' };
    }
    if (!shipment) {
      await this.markProcessed(log.webhookLogId, `No shipment for AWB ${extracted.awbNumber}`);
      return { accepted: true, message: 'No shipment matched AWB — logged only' };
    }
    if (!extracted.normalizedStatus) {
      await this.markProcessed(log.webhookLogId, 'No status in payload');
      return { accepted: true, message: 'No status in payload — logged only' };
    }

    const trackingEvent = this.toTrackingEvent(extracted, input.body);

    try {
      await this.shipmentRecordService.saveTrackingEvents(
        shipment.shipmentId,
        [trackingEvent],
        'WEBHOOK',
      );
      await this.markProcessed(log.webhookLogId, null);
      this.logger.log(
        `Webhook applied: provider=${provider.providerCode} shipment=${shipment.shipmentId} awb=${extracted.awbNumber} status=${extracted.normalizedStatus}`,
      );
      return {
        accepted: true,
        message: 'Tracking event applied',
        shipmentId: shipment.shipmentId,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.markProcessed(log.webhookLogId, message);
      this.logger.error(`Webhook processing failed for shipment ${shipment.shipmentId}`, message);
      return { accepted: true, message: 'Logged with error' };
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private toTrackingEvent(
    extracted: IWebhookEventData,
    rawBody: Record<string, unknown>,
  ): ITrackingEvent {
    return {
      // ShipmentRecordService.saveTrackingEvents uses `status` for both the persisted
      // provider_status and the input to mapProviderStatus. We pass the normalized form
      // so the mapper recognizes it.
      status: extracted.normalizedStatus as string,
      providerStatus: extracted.providerStatus ?? (extracted.normalizedStatus as string),
      internalStatus: '',
      trackingEventId: 0,
      description: extracted.description,
      eventTime: extracted.eventTime,
      location: extracted.location ?? undefined,
      metadata: rawBody,
    };
  }

  private async persistLog(
    courierProviderId: number | null,
    providerAccountId: number | null,
    input: ICourierWebhookInput,
    signatureValid: boolean,
    errorMessage: string | null,
  ): Promise<TxnCourierWebhookLog> {
    return this.webhookLogRepository.create({
      courierProviderId,
      providerAccountId,
      payload: input.body as Record<string, unknown>,
      headers: this.serializableHeaders(input.headers),
      signatureValid,
      processed: false,
      errorMessage,
    } as TxnCourierWebhookLog);
  }

  private async markProcessed(logId: number, errorMessage: string | null): Promise<void> {
    await this.webhookLogRepository.update(
      { processed: true, errorMessage },
      { where: { webhookLogId: logId } },
    );
  }

  private serializableHeaders(
    headers: Record<string, string | string[] | undefined>,
  ): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(headers)) {
      const value = headers[key];
      if (value === undefined) continue;
      out[key] = Array.isArray(value) ? value : String(value);
    }
    return out;
  }
}
