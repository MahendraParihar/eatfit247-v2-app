import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstCurrencyModel } from '../database/models';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectModel(MstCurrencyModel)
    private readonly currencyModel: typeof MstCurrencyModel,
  ) {}

  async getAllCurrencies(): Promise<MstCurrencyModel[]> {
    return await this.currencyModel.findAll() as MstCurrencyModel[];
  }
}

