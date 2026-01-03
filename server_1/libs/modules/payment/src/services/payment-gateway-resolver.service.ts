import { IResolvedGateway, IResolveGatewayInput } from '@eatfit247-shared-lib';
import { Injectable } from '@nestjs/common';
import { FranchisePaymentGatewayService } from '@server_1/modules/franchise';

@Injectable()
export class PaymentGatewayResolverService {
  constructor(
    private readonly franchisePgService: FranchisePaymentGatewayService,
  ) {}

  async resolve(input: IResolveGatewayInput): Promise<IResolvedGateway> {
    const { franchiseId, currency, isInternational, amount } = input;
    // 1️⃣ Fetch all ACTIVE gateways for franchise + currency
    const gateways = await this.franchisePgService.findActiveByFranchiseAndCurrency({
      franchiseId,
      currency,
    });
    if (!gateways.length) {
      throw new Error(
        `No payment gateway configured for franchise=${franchiseId}, currency=${currency}`,
      );
    }
    // 2️⃣ Filter by domestic / international capability
    const eligibleGateway = gateways.find((g) =>
      isInternational ? g.supportsInternational : g.supportsDomestic,
    );
    if (!eligibleGateway) {
      throw new Error(
        `No eligible payment gateway for ${isInternational ? 'international' : 'domestic'} payment`,
      );
    }
    return {
      franchisePaymentGatewayId: eligibleGateway.franchisePaymentGatewayId,
      gatewayCode: eligibleGateway.paymentGateway.code,
      providerCountryCode: eligibleGateway.paymentGateway.providerCountryCode,
      currency: eligibleGateway.currencyCode,
    };
  }
}

