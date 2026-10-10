import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { MstFranchiseLut } from '../models';

/** Letter of Undertaking register (roadmap 4.6, decision 5). */
@Injectable()
export class LutService {
  constructor(@InjectModel(MstFranchiseLut) private readonly lutRepository: typeof MstFranchiseLut) {}

  /** The active LUT of a franchise valid on `onDate` (YYYY-MM-DD), or null. Rows without dates never count. */
  public async findValid(franchiseId: number, onDate: string): Promise<MstFranchiseLut | null> {
    return this.lutRepository.findOne({
      where: {
        franchiseId,
        active: true,
        validFrom: { [Op.ne]: null, [Op.lte]: onDate },
        validTo: { [Op.ne]: null, [Op.gte]: onDate },
      },
      order: [['validFrom', 'DESC']],
    });
  }
}
