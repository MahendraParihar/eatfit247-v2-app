import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMemberCallLog, TxnMember } from '../models';
import { CommonFunctionsUtil } from '@server/common';
import { IMemberCallLog, ITableList, IBasicSearch } from 'eatfit247-shared-lib';
import { Op } from 'sequelize';

@Injectable()
export class MemberCallLogsService {
  constructor(
    @InjectModel(TxnMemberCallLog)
    private readonly memberCallLogRepository: typeof TxnMemberCallLog,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
  ) {}

  /**
   * Get all call logs with pagination and search
   * @param searchDto - Search parameters
   * @returns Paginated list of call logs
   */
  public async findAll(
    searchDto: IBasicSearch & { search?: string },
  ): Promise<ITableList<IMemberCallLog>> {
    const whereCondition: any = {};

    if (searchDto.search) {
      whereCondition[Op.or] = [
        { detail: { [Op.iLike]: `%${searchDto.search}%` } },
        { conversionHistory: { [Op.iLike]: `%${searchDto.search}%` } },
      ];
    }

    if (searchDto.active !== undefined && searchDto.active !== null) {
      whereCondition.active = searchDto.active;
    }

    const pageNumber = searchDto.page || 0;
    const pageSize = searchDto.limit || 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const { rows, count } = await this.memberCallLogRepository.scope('list').findAndCountAll({
      where: whereCondition,
      order: [
        ['date', 'DESC'],
        ['startTime', 'DESC'],
      ],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    const resList: IMemberCallLog[] = rows.map((item: TxnMemberCallLog) =>
      this.convertToModel(item),
    );
    return { tableData: resList, count: count };
  }

  /**
   * Get all call logs for a member
   * @param memberId - Member ID
   * @returns Array of member call logs
   */
  public async findByMemberId(memberId: number): Promise<IMemberCallLog[]> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const records = await this.memberCallLogRepository.scope('list').findAll({
      where: { memberId },
      order: [
        ['date', 'DESC'],
        ['startTime', 'DESC'],
      ],
      raw: true,
      nest: true,
    });
    return records.map((item: TxnMemberCallLog) => this.convertToModel(item));
  }

  private convertToModel(item: TxnMemberCallLog): IMemberCallLog {
    const memberFirstName = item.member?.firstName || '';
    const memberLastName = item.member?.lastName || '';
    const memberName = `${memberFirstName} ${memberLastName}`.trim() || '';

    return {
      memberCallLogId: item.memberCallLogId,
      memberId: item.memberId,
      memberName: memberName || undefined,
      memberFirstName: memberFirstName || undefined,
      memberLastName: memberLastName || undefined,
      memberEmail: item.member?.emailId || undefined,
      callTypeId: item.callTypeId,
      callPurposeId: item.callPurposeId,
      callLogStatusId: item.callLogStatusId,
      callType: item.callType?.callType,
      callPurpose: item.callPurpose?.callPurpose,
      callLogStatus: item.callLogStatus?.callLogStatus,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      detail: item.detail,
      isMailSuccess: item.isMailSuccess,
      conversionHistory: item.conversionHistory,
      active: item.active,
      createdBy: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : (null as any),
      updatedBy: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : (null as any),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
