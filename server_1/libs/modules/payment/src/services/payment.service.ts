import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@server_1/core';
import { PaymentGatewayResolverService } from './payment-gateway-resolver.service';
import { ConfigParam, TaxTypeEnum } from '@eatfit247-shared-lib';
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
    return await this.gatewayCredentialService.getActiveCredentials(gateway.franchisePaymentGatewayId, credentialMode);
  }

  // async generateInvoiceNumber({ sequelize, taxType: TaxTypeEnum, franchiseCode, currency }: {
  //   sequelize: any;
  //   taxType: TaxTypeEnum;
  //   franchiseCode: string;
  //   currency: string;
  // }) {
  //   const prefixMap = {
  //     GST: 'GST/INV',
  //     VAT: 'VAT/INV',
  //     NO_TAX: 'INV',
  //   };
  //   const prefix = prefixMap[taxType];
  //   const ym = dayjs().format('YYYYMM');
  //   const invoicePrefix = `${prefix}/${franchiseCode}/${currency}/${ym}`;
  //   const [result] = await sequelize.query(
  //     `
  //       SELECT COUNT(*)::int AS count
  //       FROM member_payments
  //       WHERE invoice_number LIKE :pattern
  //     `,
  //     {
  //       replacements: {
  //         pattern: `${invoicePrefix}/%`,
  //       },
  //       type: QueryTypes.SELECT,
  //     },
  //   );
  //   const seq = String(result.count + 1).padStart(6, '0');
  //   return `${invoicePrefix}/${seq}`;
  // }
}

