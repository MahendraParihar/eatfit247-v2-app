import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstPaymentGatewayCredentials } from '../models';

@Injectable()
export class PaymentGatewayCredentialService {
  constructor(
    @InjectModel(MstPaymentGatewayCredentials)
    private readonly paymentGatewayCredentials: typeof MstPaymentGatewayCredentials,
  ) {}

  async getActiveCredentials(
    franchisePaymentGatewayId: number,
    mode: string,
  ): Promise<MstPaymentGatewayCredentials> {
    return await this.paymentGatewayCredentials.findOne({
      where: {
        franchisePaymentGatewayId: franchisePaymentGatewayId,
        mode: mode,
      },
    });
  }
}

