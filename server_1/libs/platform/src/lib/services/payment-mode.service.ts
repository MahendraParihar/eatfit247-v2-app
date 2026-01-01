import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstPaymentMode } from '../database/models/mst-payment-mode.model';
import { IDropdownItem } from '@eatfit247-shared-lib';

@Injectable()
export class PaymentModeService {
  constructor(
    @InjectModel(MstPaymentMode) private readonly paymentModeRepository: typeof MstPaymentMode,
  ) {}

  /**
   * Get active payment modes as dropdown list
   */
  public async getDropdownList(): Promise<IDropdownItem[]> {
    const paymentModes = await this.paymentModeRepository.findAll({
      where: { active: true },
      order: [['paymentMode', 'ASC']],
      attributes: ['paymentModeId', 'paymentMode'],
    });
    return paymentModes.map((mode) => ({
      id: mode.paymentModeId,
      label: mode.paymentMode,
      selected: false,
    }));
  }

  /**
   * Get payment mode by ID
   */
  public async findById(id: number): Promise<MstPaymentMode | null> {
    return this.paymentModeRepository.findOne({
      where: { paymentModeId: id, active: true },
    });
  }

  /**
   * Get all active payment modes
   */
  public async getActiveList(): Promise<MstPaymentMode[]> {
    return this.paymentModeRepository.findAll({
      where: { active: true },
      order: [['paymentMode', 'ASC']],
    });
  }
}

