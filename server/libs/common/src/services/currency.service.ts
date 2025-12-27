import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { IEmailData } from '../../../modules/email';
import * as ejs from 'ejs';
import { InjectModel } from '@nestjs/sequelize';
import { ISendEmailParams } from 'eatfit247-shared-lib';
import { AppConfigService } from '../app-config';
import { LogErrorService } from './log-error.service';
import { MstEmailTemplate } from '../models/mst-email-template.model';
import { MstCurrencyModel } from '../models/mst-currencies.model';

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

