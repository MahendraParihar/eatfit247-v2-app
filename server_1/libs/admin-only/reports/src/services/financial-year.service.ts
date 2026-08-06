import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import moment from 'moment';
import { MstFranchise } from '@server_1/core';
import { TxnMember } from '@server_1/modules/member';
import { FinancialYearUtil, IAuthUser, IFinancialYearOption } from '@eatfit247-shared-lib';

export interface IFranchiseSummary {
  franchiseId: number;
  companyName: string;
}

export interface IFranchiseFyContext {
  franchiseId: number;
  companyName: string;
  /** 1 = Jan-Dec calendar year, 4 = Apr-Mar Indian FY. */
  fyStartMonth: number;
  availableYears: IFinancialYearOption[];
}

/**
 * Franchise resolution, RBAC scoping and financial-year enumeration shared by the
 * admin report services.
 *
 * Lives in the reports lib rather than `libs/core` because it needs both
 * `MstFranchise` (core) and `TxnMember` (modules), and core sits below modules
 * in the NX layering.
 */
@Injectable()
export class FinancialYearService {
  constructor(
    @InjectModel(MstFranchise) private readonly franchiseRepository: typeof MstFranchise,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
  ) {}

  /**
   * Franchises this user is allowed to query.
   * - franchise-scoped admin: only their own franchiseIds
   * - super admin (empty franchiseIds): all active franchises
   */
  async getAccessibleFranchises(user: IAuthUser): Promise<IFranchiseSummary[]> {
    const where: Record<string, unknown> = { active: true };
    if (user.franchiseIds && user.franchiseIds.length > 0) {
      where['franchiseId'] = { [Op.in]: user.franchiseIds };
    }
    const list = await this.franchiseRepository.findAll({
      where,
      attributes: ['franchiseId', 'companyName'],
      order: [['companyName', 'ASC']],
      raw: true,
    });
    return list.map((f) => ({ franchiseId: f.franchiseId, companyName: f.companyName }));
  }

  /** Resolve which franchise's FY config to use, plus the list of selectable years. */
  async getFranchiseContext(user: IAuthUser, franchiseId?: number): Promise<IFranchiseFyContext> {
    const franchise = await this.resolveFranchise(user, franchiseId);
    const fyStartMonth = FinancialYearUtil.normaliseStartMonth(franchise.financialYear);
    const availableYears = await this.buildAvailableYears(franchise.franchiseId, fyStartMonth);

    return {
      franchiseId: franchise.franchiseId,
      companyName: franchise.companyName,
      fyStartMonth,
      availableYears,
    };
  }

  /**
   * Resolve a requested franchise against the user's RBAC scope.
   * Throws rather than silently widening when a scoped admin asks for someone else's franchise.
   */
  async resolveFranchise(user: IAuthUser, franchiseId?: number): Promise<MstFranchise> {
    const scoped = !!(user.franchiseIds && user.franchiseIds.length > 0);

    if (franchiseId !== undefined && franchiseId !== null) {
      if (scoped && !user.franchiseIds.includes(franchiseId)) {
        throw new ForbiddenException('You do not have access to this franchise.');
      }
      const found = await this.franchiseRepository.findOne({ where: { franchiseId, active: true } });
      if (!found) {
        throw new NotFoundException('Franchise not found.');
      }
      return found;
    }

    if (scoped) {
      const own = await this.franchiseRepository.findOne({
        where: { franchiseId: { [Op.in]: user.franchiseIds }, active: true },
        order: [
          ['isPrimary', 'DESC'],
          ['franchiseId', 'ASC'],
        ],
      });
      if (!own) {
        throw new NotFoundException('Your assigned franchise was not found.');
      }
      return own;
    }

    const primary = await this.franchiseRepository.findOne({
      where: { active: true },
      order: [
        ['isPrimary', 'DESC'],
        ['isDefault', 'DESC'],
        ['franchiseId', 'ASC'],
      ],
    });
    if (!primary) {
      throw new NotFoundException('No franchise configured.');
    }
    return primary;
  }

  /**
   * Franchise scope for a `where` clause: an explicit selection when given,
   * otherwise the user's own franchises, otherwise unrestricted (super admin).
   *
   * Validates the explicit selection against the user's scope so a forged request
   * body cannot widen access.
   */
  buildFranchiseScopeWhere(franchiseId: number | undefined, user: IAuthUser): Record<string, unknown> {
    const scoped = !!(user.franchiseIds && user.franchiseIds.length > 0);

    if (franchiseId !== undefined && franchiseId !== null) {
      if (scoped && !user.franchiseIds.includes(franchiseId)) {
        throw new ForbiddenException('You do not have access to this franchise.');
      }
      return { franchiseId };
    }
    if (scoped) {
      return { franchiseId: { [Op.in]: user.franchiseIds } };
    }
    return {};
  }

  /** Financial years from the franchise's earliest member up to the current one, newest first. */
  async buildAvailableYears(franchiseId: number, fyStartMonth: number): Promise<IFinancialYearOption[]> {
    const earliest = await this.memberRepository.findOne({
      where: { franchiseId },
      attributes: [[Sequelize.fn('MIN', Sequelize.col('created_at')), 'earliest']],
      raw: true,
    });
    const earliestDate = (earliest as unknown as { earliest: Date | null })?.earliest;
    const startFyYear = FinancialYearUtil.fyStartYearFor(
      fyStartMonth,
      earliestDate ? new Date(earliestDate) : new Date(),
    );
    const currentFyYear = FinancialYearUtil.fyStartYearFor(fyStartMonth, new Date());

    const out: IFinancialYearOption[] = [];
    for (let year = currentFyYear; year >= startFyYear; year--) {
      out.push(FinancialYearUtil.buildFyOption(year, fyStartMonth));
    }
    return out;
  }

  /** Look up a specific FY, falling back to building it when outside the enumerated range. */
  findOrBuildFy(context: IFranchiseFyContext, fyStartYear: number): IFinancialYearOption {
    const found = context.availableYears.find((y) => y.fyStartYear === fyStartYear);
    if (found) {
      return found;
    }
    if (!Number.isInteger(fyStartYear) || fyStartYear < 2000 || fyStartYear > 2100) {
      throw new BadRequestException('Invalid financial year.');
    }
    return FinancialYearUtil.buildFyOption(fyStartYear, context.fyStartMonth);
  }

  /** The 12 months of an FY in order, for month-bucketed dashboards. */
  buildMonthSequence(
    fyStartMonth: number,
    fyStartYear: number,
  ): Array<{ monthIndex: number; monthLabel: string; ymKey: string }> {
    const seq: Array<{ monthIndex: number; monthLabel: string; ymKey: string }> = [];
    for (let i = 0; i < 12; i++) {
      const m = moment({ year: fyStartYear, month: fyStartMonth - 1, day: 1 }).add(i, 'month');
      seq.push({
        monthIndex: m.month() + 1,
        monthLabel: m.format('MMM'),
        ymKey: m.format('YYYY-MM'),
      });
    }
    return seq;
  }
}
