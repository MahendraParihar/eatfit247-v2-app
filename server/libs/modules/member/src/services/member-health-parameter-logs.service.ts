import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMemberHealthParameterLog, TxnMember, TxnMemberHealthParameter } from '../models';
import { CommonFunctionsUtil, MstHealthParameter, MstHealthParameterUnit } from '@server/common';
import { IMemberHealthParameterLog, IMemberHealthParameter } from 'eatfit247-shared-lib';

@Injectable()
export class MemberHealthParameterLogsService {
  constructor(
    @InjectModel(TxnMemberHealthParameterLog)
    private readonly memberHealthParameterLogRepository: typeof TxnMemberHealthParameterLog,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
  ) {}

  /**
   * Get all health parameter logs for a member
   * @param memberId - Member ID
   * @returns Array of member health parameter logs with nested health parameters
   */
  public async findByMemberId(memberId: number): Promise<IMemberHealthParameterLog[]> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Fetch health parameter logs with nested health parameters using Sequelize joins
    const records = await this.memberHealthParameterLogRepository.scope('details').findAll({
      where: { memberId },
      order: [['logDate', 'DESC']],
      raw: false,
      nest: true,
    });
    return records.map((log) => this.convertToModel(log));
  }

  private convertToModel(item: TxnMemberHealthParameterLog): IMemberHealthParameterLog {
    // Convert logDate from Date to timestamp (number) as per interface
    const logDateTimestamp =
      item.logDate instanceof Date
        ? item.logDate.getTime()
        : typeof item.logDate === 'string'
          ? new Date(item.logDate).getTime()
          : item.logDate;
    return {
      memberHealthParameterLogId: item.memberHealthParameterLogId,
      memberId: item.memberId,
      logDate: logDateTimestamp,
      healthParameters: (item.healthParameters || []).map((param: TxnMemberHealthParameter) =>
        this.convertHealthParameterToModel(param),
      ),
      active: item.active,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
    };
  }

  private convertHealthParameterToModel(item: any): IMemberHealthParameter {
    return {
      memberHealthParameterLogId: item.memberHealthParameterLogId,
      healthParameterId: item.healthParameterId,
      healthParameter: item.healthParameter?.healthParameter || '',
      value: item.value,
      healthParameterUnitId: item.healthParameterUnitId || 0,
      healthParameterUnit: item.healthParameterUnit?.healthParameterUnit || '',
    };
  }
}
