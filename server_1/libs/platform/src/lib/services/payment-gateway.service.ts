import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { MstPaymentGateway } from '../database/models';
import { IDropdownItem } from "@eatfit247-shared-lib";

@Injectable()
export class PaymentGatewayService {
  constructor(
    @InjectModel(MstPaymentGateway)
    private readonly paymentGatewayRepository: typeof MstPaymentGateway,
  ) {}

  /**
   * Get active payment gateways as dropdown list
   */
  public async getDropdownList(): Promise<IDropdownItem[]> {
    const paymentGateways = await this.paymentGatewayRepository.findAll({
      where: { active: true },
      order: [['name', 'ASC']],
      attributes: ['paymentGatewayId', 'name', 'code'],
    });
    return paymentGateways.map((gateway) => ({
      id: gateway.paymentGatewayId,
      label: gateway.name,
      selected: false,
    }));
  }

  /**
   * Get payment gateway by ID
   */
  public async findById(id: number): Promise<MstPaymentGateway | null> {
    return this.paymentGatewayRepository.findOne({
      where: { paymentGatewayId: id, active: true },
    });
  }

  /**
   * Get payment gateway by code
   */
  public async findByCode(code: string): Promise<MstPaymentGateway | null> {
    return this.paymentGatewayRepository.findOne({
      where: { code, active: true },
    });
  }

  /**
   * Get all active payment gateways
   */
  public async getActiveList(): Promise<MstPaymentGateway[]> {
    return this.paymentGatewayRepository.findAll({
      where: { active: true },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Get payment gateways by country code
   */
  public async findByCountryCode(countryCode: string): Promise<MstPaymentGateway[]> {
    return this.paymentGatewayRepository.findAll({
      where: {
        active: true,
        [Op.or]: [
          { providerCountryCode: countryCode },
          { supportsInternational: true },
        ],
      },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Get payment gateways that support recurring payments
   */
  public async getRecurringSupported(): Promise<MstPaymentGateway[]> {
    return this.paymentGatewayRepository.findAll({
      where: { active: true, supportsRecurring: true },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Get payment gateways that support refunds
   */
  public async getRefundSupported(): Promise<MstPaymentGateway[]> {
    return this.paymentGatewayRepository.findAll({
      where: { active: true, supportsRefund: true },
      order: [['name', 'ASC']],
    });
  }
}

