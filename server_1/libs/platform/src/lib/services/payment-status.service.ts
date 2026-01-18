import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstPaymentStatus } from '../database/models/mst-payment-status.model';
import { IDropdownItem } from '@eatfit247-shared-lib';

@Injectable()
export class PaymentStatusService {
  constructor(
    @InjectModel(MstPaymentStatus) private readonly paymentStatusRepository: typeof MstPaymentStatus,
  ) {}

  /**
   * Get active payment statuses as a dropdown list
   */
  public async getDropdownList(): Promise<IDropdownItem[]> {
    const statuses = await this.paymentStatusRepository.findAll({
      where: { active: true },
      order: [['paymentStatus', 'ASC']],
      attributes: ['paymentStatusId', 'paymentStatus'],
    });
    return statuses.map((status) => ({
      id: status.paymentStatusId,
      label: status.paymentStatus,
      selected: false,
    }));
  }

  /**
   * Get payment status by ID
   */
  public async findById(id: number): Promise<MstPaymentStatus | null> {
    return this.paymentStatusRepository.findOne({
      where: { paymentStatusId: id, active: true },
    });
  }

  /**
   * Get all active payment statuses
   */
  public async getActiveList(): Promise<MstPaymentStatus[]> {
    return this.paymentStatusRepository.findAll({
      where: { active: true },
      order: [['paymentStatus', 'ASC']],
    });
  }
}

