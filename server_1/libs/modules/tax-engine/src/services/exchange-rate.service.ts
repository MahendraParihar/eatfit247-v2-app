import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { ExchangeRateSourceEnum, IAuthUser, IExchangeRate, IManageExchangeRate } from '@eatfit247-shared-lib';
import { MstExchangeRate } from '../models';

/** What the rate is for: Indian GST values goods at the customs rate (Rule 34(1)), services at GAAP (34(2)). */
export type ExchangeRatePurpose = 'SERVICES' | 'GOODS';

export interface IResolvedRate {
  rate: number;
  rateDate: string;
  source: string;
}

/** A published rate is used for up to this many days (weekends, holidays) before FX is "pending". */
const MAX_RATE_AGE_DAYS = 10;

/** FBIL product names → ISO code and units quoted (INR per N units). */
const FBIL_PRODUCTS: Record<string, { currency: string; units: number }> = {
  'INR / 1 USD': { currency: 'USD', units: 1 },
  'INR / 1 GBP': { currency: 'GBP', units: 1 },
  'INR / 1 EUR': { currency: 'EUR', units: 1 },
  'INR / 100 JPY': { currency: 'JPY', units: 100 },
};

const FBIL_URL = 'https://www.fbil.org.in/wasdm/refrates/fetchfiltered';

interface IFbilRow {
  processRunDate: string;
  subProdName: string;
  rate: number;
}

/**
 * Exchange rates from official publishers only (decision 19): FBIL for INR (fetched daily), the
 * UAE Central Bank's USD peg for AED, CBIC customs rates and manual entries by Finance.
 */
@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  constructor(@InjectModel(MstExchangeRate) private readonly rateRepository: typeof MstExchangeRate) {}

  /**
   * Rate for `from` → `to` on `onDate` (YYYY-MM-DD), or null when none qualifies yet.
   *   - A MANUAL rate for that exact day wins.
   *   - GOODS into INR: the CBIC customs rate whose notified period covers the date.
   *   - Otherwise the latest FBIL / CBUAE peg / MANUAL rate on or before the date, at most
   *     MAX_RATE_AGE_DAYS old (the peg never ages). The inverse pair is used when needed.
   */
  public async findRate(from: string, to: string, onDate: string, purpose: ExchangeRatePurpose): Promise<IResolvedRate | null> {
    const fromCode = (from || '').toUpperCase();
    const toCode = (to || '').toUpperCase();
    if (!fromCode || !toCode) {
      return null;
    }
    if (fromCode === toCode) {
      return { rate: 1, rateDate: onDate, source: 'SAME' };
    }
    return (await this.findDirect(fromCode, toCode, onDate, purpose)) ?? this.invert(await this.findDirect(toCode, fromCode, onDate, purpose));
  }

  private async findDirect(from: string, to: string, onDate: string, purpose: ExchangeRatePurpose): Promise<IResolvedRate | null> {
    const pair = { fromCurrency: from, toCurrency: to, active: true };
    const manual = await this.rateRepository.findOne({
      where: { ...pair, source: ExchangeRateSourceEnum.MANUAL, rateDate: onDate },
    });
    if (manual) {
      return this.resolved(manual);
    }
    if (purpose === 'GOODS' && to === 'INR') {
      const customs = await this.rateRepository.findOne({
        where: {
          ...pair,
          source: ExchangeRateSourceEnum.CBIC_CUSTOMS,
          rateDate: { [Op.lte]: onDate },
          [Op.or]: [{ validTo: null }, { validTo: { [Op.gte]: onDate } }],
        } as WhereOptions<MstExchangeRate>,
        order: [['rateDate', 'DESC']],
      });
      return customs ? this.resolved(customs) : null;
    }
    const oldest = this.addDays(onDate, -MAX_RATE_AGE_DAYS);
    const latest = await this.rateRepository.findOne({
      where: {
        ...pair,
        rateDate: { [Op.lte]: onDate },
        [Op.or]: [
          { source: ExchangeRateSourceEnum.CBUAE_PEG },
          {
            source: { [Op.in]: [ExchangeRateSourceEnum.FBIL, ExchangeRateSourceEnum.MANUAL] },
            rateDate: { [Op.gte]: oldest },
          },
        ],
      } as WhereOptions<MstExchangeRate>,
      order: [['rateDate', 'DESC']],
    });
    return latest ? this.resolved(latest) : null;
  }

  /** Fetches FBIL reference rates for the date range and upserts them; returns rows saved. */
  public async fetchFbil(fromDate: string, toDate: string): Promise<number> {
    const url = `${FBIL_URL}?fromDate=${fromDate}&toDate=${toDate}&authenticated=false`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    let rows: IFbilRow[];
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) {
        throw new Error(`FBIL responded ${response.status}`);
      }
      rows = (await response.json()) as IFbilRow[];
    } finally {
      clearTimeout(timer);
    }
    let saved = 0;
    for (const row of Array.isArray(rows) ? rows : []) {
      const product = FBIL_PRODUCTS[row.subProdName];
      const rateDate = (row.processRunDate || '').slice(0, 10);
      const rate = Number(row.rate) / (product?.units || 1);
      if (!product || !/^\d{4}-\d{2}-\d{2}$/.test(rateDate) || !(rate > 0)) {
        continue;
      }
      await this.upsert({ rateDate, fromCurrency: product.currency, toCurrency: 'INR', rate, source: ExchangeRateSourceEnum.FBIL, note: row.subProdName });
      saved += 1;
    }
    return saved;
  }

  public async list(filter: { fromCurrency?: string; toCurrency?: string; limit?: number }): Promise<IExchangeRate[]> {
    const where: Record<string, unknown> = {};
    if (filter.fromCurrency) where['fromCurrency'] = filter.fromCurrency.toUpperCase();
    if (filter.toCurrency) where['toCurrency'] = filter.toCurrency.toUpperCase();
    const rows = await this.rateRepository.findAll({
      where,
      order: [['rateDate', 'DESC'], ['fromCurrency', 'ASC']],
      limit: Math.min(Number(filter.limit) || 200, 1000),
    });
    return rows.map((row) => this.toModel(row));
  }

  /** Finance entry: a MANUAL rate for one day, or a CBIC customs rate for its notified period. */
  public async create(obj: IManageExchangeRate, user: IAuthUser, ip: string): Promise<IExchangeRate> {
    const from = obj.fromCurrency.toUpperCase();
    const to = obj.toCurrency.toUpperCase();
    if (from === to) {
      throw new BadRequestException('Choose two different currencies.');
    }
    if (obj.source === 'CBIC_CUSTOMS' && to !== 'INR') {
      throw new BadRequestException('CBIC customs rates are into INR.');
    }
    if (obj.validTo && obj.validTo < obj.rateDate) {
      throw new BadRequestException('"Valid to" must be on or after the rate date.');
    }
    if (obj.source === 'MANUAL' && !obj.note?.trim()) {
      throw new BadRequestException('Add a note saying where the manual rate comes from (official page and date).');
    }
    const row = await this.upsert(
      {
        rateDate: obj.rateDate,
        fromCurrency: from,
        toCurrency: to,
        rate: Number(obj.rate),
        source: obj.source,
        validTo: obj.validTo || null,
        note: obj.note?.trim() || null,
      },
      user.adminId,
      ip,
    );
    return this.toModel(row);
  }

  public async changeStatus(id: number, active: boolean, user: IAuthUser, ip: string): Promise<void> {
    const row = await this.rateRepository.findByPk(id);
    if (!row) {
      throw new NotFoundException('Exchange rate not found');
    }
    if (row.source === ExchangeRateSourceEnum.CBUAE_PEG && !active) {
      throw new BadRequestException('The official USD peg cannot be deactivated.');
    }
    await row.update({ active, modifiedBy: user.adminId, modifiedIp: ip });
  }

  private async upsert(
    values: Pick<MstExchangeRate, 'rateDate' | 'fromCurrency' | 'toCurrency' | 'rate' | 'source'> &
      Partial<Pick<MstExchangeRate, 'validTo' | 'note'>>,
    adminId: number | null = null,
    ip: string | null = null,
  ): Promise<MstExchangeRate> {
    const existing = await this.rateRepository.findOne({
      where: {
        rateDate: values.rateDate,
        fromCurrency: values.fromCurrency,
        toCurrency: values.toCurrency,
        source: values.source,
      },
    });
    if (existing) {
      await existing.update({ ...values, active: true, modifiedBy: adminId, modifiedIp: ip });
      return existing;
    }
    return this.rateRepository.create({
      ...values,
      active: true,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: ip,
      modifiedIp: ip,
    } as MstExchangeRate);
  }

  private resolved(row: MstExchangeRate): IResolvedRate {
    return { rate: Number(row.rate), rateDate: row.rateDate, source: row.source };
  }

  private invert(resolved: IResolvedRate | null): IResolvedRate | null {
    return resolved ? { ...resolved, rate: 1 / resolved.rate } : null;
  }

  private addDays(date: string, days: number): string {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  private toModel(row: MstExchangeRate): IExchangeRate {
    return {
      exchangeRateId: row.exchangeRateId,
      rateDate: row.rateDate,
      fromCurrency: row.fromCurrency,
      toCurrency: row.toCurrency,
      rate: Number(row.rate),
      source: row.source,
      validTo: row.validTo,
      note: row.note,
      active: row.active,
    };
  }
}
