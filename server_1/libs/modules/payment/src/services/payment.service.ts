import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@server_1/core';
import { PaymentGatewayResolverService } from './payment-gateway-resolver.service';
import { ConfigParam } from '@eatfit247-shared-lib';
import { PaymentGatewayCredentialService } from './payment-gateway-credential.service';

@Injectable()
export class PaymentService {
  constructor(
    private appConfig: AppConfigService,
    private readonly gatewayResolver: PaymentGatewayResolverService,
    private readonly gatewayCredentialService: PaymentGatewayCredentialService,
  ) {}

  async resolve(franchiseId: number, currency: string, isInternational: boolean, amount: number) {
    const gateway = await this.gatewayResolver.resolve({
      franchiseId,
      currency,
      isInternational,
      amount,
    });
    // environment decides mode
    const credentialMode = this.appConfig.getString(ConfigParam.PAYMENT_MODE);
    const credentials = await this.gatewayCredentialService.getActiveCredentials(gateway.franchisePaymentGatewayId, credentialMode);
  }
}

