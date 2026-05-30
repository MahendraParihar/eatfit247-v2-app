import { BadRequestException, Injectable } from '@nestjs/common';
import { CourierProvider } from '@eatfit247-shared-lib';
import { IWebhookStrategy } from './webhook-strategy.interface';
import { NimbusWebhookStrategy } from './nimbus.webhook-strategy';
import { ShiprocketWebhookStrategy } from './shiprocket.webhook-strategy';
import { ShipwayWebhookStrategy } from './shipway.webhook-strategy';

@Injectable()
export class WebhookStrategyFactory {
  constructor(
    private readonly nimbus: NimbusWebhookStrategy,
    private readonly shiprocket: ShiprocketWebhookStrategy,
    private readonly shipway: ShipwayWebhookStrategy,
  ) {}

  getStrategy(providerCode: string): IWebhookStrategy {
    if (!providerCode || providerCode.trim().length === 0) {
      throw new BadRequestException('Provider code is required');
    }
    const code = providerCode.toUpperCase().trim();
    switch (code) {
      case CourierProvider.NIMBUS:
        return this.nimbus;
      case CourierProvider.SHIPROCKET:
        return this.shiprocket;
      case CourierProvider.SHIPWAY:
        return this.shipway;
      default:
        throw new BadRequestException(`Unsupported courier provider for webhook: ${code}`);
    }
  }
}
