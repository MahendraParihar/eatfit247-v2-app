import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Public } from '@server_1/core';
import { CourierWebhookService } from '../../services/courier-webhook.service';

@Public()
@Controller('courier/webhook')
export class CourierWebhookController {
  private readonly logger = new Logger(CourierWebhookController.name);

  constructor(private readonly courierWebhookService: CourierWebhookService) {}

  @Post(':providerCode')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('providerCode') providerCode: string,
    @Req() req: any,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<{ status: string; message: string; shipmentId?: number }> {
    const rawBody = typeof req.rawBody === 'string' ? req.rawBody : '';
    const body = (req.body ?? {}) as Record<string, unknown>;

    const result = await this.courierWebhookService.process({
      providerCode,
      rawBody,
      headers,
      body,
    });

    if (!result.accepted) {
      this.logger.warn(`Webhook rejected for ${providerCode}: ${result.message}`);
      throw new UnauthorizedException(result.message);
    }

    return { status: 'ok', message: result.message, shipmentId: result.shipmentId };
  }
}
