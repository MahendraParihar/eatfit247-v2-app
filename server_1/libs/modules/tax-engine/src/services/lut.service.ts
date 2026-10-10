import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { FranchiseLutStatus, IAuthUser, IFranchiseLut, IManageFranchiseLut } from '@eatfit247-shared-lib';
import { FranchiseDateUtil } from '@server_1/platform';
import { MstFranchiseLut } from '../models';

/** Days before expiry when an LUT shows as EXPIRING. */
const EXPIRY_WARNING_DAYS = 30;

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

  public async list(franchiseId: number, user: IAuthUser): Promise<IFranchiseLut[]> {
    this.assertFranchiseAccess(franchiseId, user);
    const rows = await this.lutRepository.findAll({
      where: { franchiseId },
      order: [['validFrom', 'DESC NULLS LAST'], ['franchiseLutId', 'DESC']],
    });
    return rows.map((row) => this.toModel(row));
  }

  public async create(franchiseId: number, obj: IManageFranchiseLut, user: IAuthUser, ip: string): Promise<IFranchiseLut> {
    this.assertFranchiseAccess(franchiseId, user);
    this.validatePeriod(obj);
    const active = obj.active ?? true;
    if (active) {
      await this.assertNoOverlap(franchiseId, obj.validFrom, obj.validTo, null);
    }
    await this.assertUniqueArn(franchiseId, obj.arn, null);
    const created = await this.lutRepository.create({
      franchiseId,
      arn: obj.arn,
      financialYear: obj.financialYear,
      validFrom: obj.validFrom,
      validTo: obj.validTo,
      active,
      createdBy: user.adminId,
      modifiedBy: user.adminId,
      createdIp: ip,
      modifiedIp: ip,
    } as MstFranchiseLut);
    return this.toModel(created);
  }

  public async update(
    franchiseId: number,
    lutId: number,
    obj: IManageFranchiseLut,
    user: IAuthUser,
    ip: string,
  ): Promise<IFranchiseLut> {
    const row = await this.findOwned(franchiseId, lutId, user);
    this.validatePeriod(obj);
    const active = obj.active ?? row.active;
    if (active) {
      await this.assertNoOverlap(franchiseId, obj.validFrom, obj.validTo, lutId);
    }
    await this.assertUniqueArn(franchiseId, obj.arn, lutId);
    await row.update({
      arn: obj.arn,
      financialYear: obj.financialYear,
      validFrom: obj.validFrom,
      validTo: obj.validTo,
      active,
      modifiedBy: user.adminId,
      modifiedIp: ip,
    });
    return this.toModel(row);
  }

  /** Soft activate / deactivate (principle 6). */
  public async changeStatus(franchiseId: number, lutId: number, active: boolean, user: IAuthUser, ip: string): Promise<void> {
    const row = await this.findOwned(franchiseId, lutId, user);
    if (active && row.validFrom && row.validTo) {
      await this.assertNoOverlap(franchiseId, row.validFrom, row.validTo, lutId);
    }
    await row.update({ active, modifiedBy: user.adminId, modifiedIp: ip });
  }

  /** Status of an LUT on `today` (YYYY-MM-DD, IST by default). */
  public static statusOf(
    lut: Pick<IFranchiseLut, 'active' | 'validFrom' | 'validTo'>,
    today: string = FranchiseDateUtil.localDate(new Date(), 'Asia/Kolkata'),
  ): FranchiseLutStatus {
    if (!lut.active) return 'INACTIVE';
    if (!lut.validFrom || !lut.validTo) return 'INCOMPLETE';
    if (today < lut.validFrom) return 'FUTURE';
    if (today > lut.validTo) return 'EXPIRED';
    const daysLeft = (Date.parse(`${lut.validTo}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000;
    return daysLeft <= EXPIRY_WARNING_DAYS ? 'EXPIRING' : 'VALID';
  }

  /** The dates must lie inside the stated Indian financial year (1 April – 31 March). */
  private validatePeriod(obj: IManageFranchiseLut): void {
    if (obj.validFrom > obj.validTo) {
      throw new BadRequestException('"Valid from" must be on or before "Valid to".');
    }
    const startYear = Number(obj.financialYear.slice(0, 4));
    const endSuffix = obj.financialYear.slice(5);
    if (String(startYear + 1).slice(-2) !== endSuffix) {
      throw new BadRequestException('Financial year must be consecutive years, e.g. 2026-27.');
    }
    const fyStart = `${startYear}-04-01`;
    const fyEnd = `${startYear + 1}-03-31`;
    if (obj.validFrom < fyStart || obj.validTo > fyEnd) {
      throw new BadRequestException(`The LUT dates must fall inside FY ${obj.financialYear} (${fyStart} to ${fyEnd}).`);
    }
  }

  private async assertNoOverlap(franchiseId: number, from: string, to: string, exceptId: number | null): Promise<void> {
    const overlapping = await this.lutRepository.findOne({
      where: {
        franchiseId,
        active: true,
        validFrom: { [Op.ne]: null, [Op.lte]: to },
        validTo: { [Op.ne]: null, [Op.gte]: from },
        ...(exceptId ? { franchiseLutId: { [Op.ne]: exceptId } } : {}),
      },
    });
    if (overlapping) {
      throw new BadRequestException(
        `These dates overlap active LUT ${overlapping.arn} (${overlapping.validFrom} to ${overlapping.validTo}). Deactivate or change it first.`,
      );
    }
  }

  private async assertUniqueArn(franchiseId: number, arn: string, exceptId: number | null): Promise<void> {
    const duplicate = await this.lutRepository.findOne({
      where: { franchiseId, arn, ...(exceptId ? { franchiseLutId: { [Op.ne]: exceptId } } : {}) },
    });
    if (duplicate) {
      throw new BadRequestException(`LUT ${arn} is already registered for this franchise.`);
    }
  }

  private async findOwned(franchiseId: number, lutId: number, user: IAuthUser): Promise<MstFranchiseLut> {
    this.assertFranchiseAccess(franchiseId, user);
    const row = await this.lutRepository.findOne({ where: { franchiseLutId: lutId, franchiseId } });
    if (!row) {
      throw new NotFoundException('LUT not found');
    }
    return row;
  }

  /** Franchise-scoped admins only reach their own franchises (principle 3). */
  private assertFranchiseAccess(franchiseId: number, user: IAuthUser): void {
    if (user.franchiseIds?.length && !user.franchiseIds.includes(Number(franchiseId))) {
      throw new ForbiddenException('You do not have access to this franchise.');
    }
  }

  private toModel(row: MstFranchiseLut): IFranchiseLut {
    const model = {
      franchiseLutId: row.franchiseLutId,
      franchiseId: row.franchiseId,
      arn: row.arn,
      financialYear: row.financialYear,
      validFrom: row.validFrom,
      validTo: row.validTo,
      active: row.active,
    };
    return { ...model, status: LutService.statusOf(model) };
  }
}
