import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMemberCallLog, TxnMember } from '../models';
import {
  CommonFunctionsUtil,
  MstCallType,
  MstCallPurpose,
  MstCallLogStatus,
  MstAdminUser,
  GoogleService,
} from '@server/common';
import {
  IMemberCallLog,
  ITableList,
  IBasicSearch,
  IManageMemberCallLog,
  ICallLogMasterData, IAvailableSlot, ICallLogSlot,
} from 'eatfit247-shared-lib';
import { Op } from 'sequelize';

@Injectable()
export class MemberCallLogsService {
  constructor(
    @InjectModel(TxnMemberCallLog)
    private readonly memberCallLogRepository: typeof TxnMemberCallLog,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(MstCallType) private readonly callTypeRepository: typeof MstCallType,
    @InjectModel(MstCallPurpose) private readonly callPurposeRepository: typeof MstCallPurpose,
    @InjectModel(MstCallLogStatus)
    private readonly callLogStatusRepository: typeof MstCallLogStatus,
    @InjectModel(MstAdminUser) private readonly adminUserRepository: typeof MstAdminUser,
    private readonly googleService: GoogleService,
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

  /**
   * Get master data for call log form (call types, purposes, statuses, nutritionists)
   */
  public async getMasterData(): Promise<ICallLogMasterData> {
    const [callTypes, callPurposes, callLogStatuses, nutritionists] = await Promise.all([
      this.callTypeRepository.findAll({
        where: { active: true },
        order: [['callType', 'ASC']],
        attributes: ['callTypeId', 'callType'],
      }),
      this.callPurposeRepository.findAll({
        where: { active: true },
        order: [['callPurpose', 'ASC']],
        attributes: ['callPurposeId', 'callPurpose'],
      }),
      this.callLogStatusRepository.findAll({
        where: { active: true },
        order: [['callLogStatus', 'ASC']],
        attributes: ['callLogStatusId', 'callLogStatus'],
      }),
      this.adminUserRepository.findAll({
        where: { active: true },
        order: [
          ['firstName', 'ASC'],
          ['lastName', 'ASC'],
        ],
        attributes: ['adminId', 'firstName', 'lastName'],
      }),
    ]);
    const durations = [{ id: 15, label: '15 minutes', selected: false },
      { id: 30, label: '30 minutes', selected: false },
      { id: 45, label: '45 minutes', selected: false },
      { id: 60, label: '1 hour', selected: false },
      { id: 90, label: '1.5 hours', selected: false },
      { id: 120, label: '2 hours', selected: false }];
    return <ICallLogMasterData>{
      callTypes: callTypes.map((t) => ({
        id: t.callTypeId,
        label: t.callType,
        selected: false,
      })),
      callPurposes: callPurposes.map((p) => ({
        id: p.callPurposeId,
        label: p.callPurpose,
        selected: false,
      })),
      callLogStatuses: callLogStatuses.map((s) => ({
        id: s.callLogStatusId,
        label: s.callLogStatus,
        selected: false,
      })),
      nutritionists: nutritionists.map((n) => ({
        id: n.adminId,
        label: `${n.firstName} ${n.lastName}`.trim(),
        selected: false,
      })),
      durations: durations,
    };
  }

  /**
   * Create or update a member call log
   */
  public async createOrUpdate(
    memberId: number,
    obj: IManageMemberCallLog,
    requestedIp: string,
    adminId: number,
  ): Promise<IMemberCallLog> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    let callLog: TxnMemberCallLog;
    if (obj.memberCallLogId) {
      // Update existing call log
      callLog = await this.memberCallLogRepository.findOne({
        where: { memberCallLogId: obj.memberCallLogId, memberId },
      });
      if (!callLog) {
        throw new NotFoundException('Call log not found');
      }
      callLog.date = obj.date as any;
      callLog.startTime = obj.startTime as any;
      callLog.endTime = obj.endTime as any;
      callLog.callTypeId = obj.callTypeId;
      callLog.callPurposeId = obj.callPurposeId;
      callLog.callLogStatusId = obj.callLogStatusId;
      callLog.detail = obj.detail || null;
      callLog.conversionHistory = obj.conversionHistory || null;
      callLog.isMailSuccess = obj.isMailSuccess !== undefined ? obj.isMailSuccess : false;
      callLog.nutritionistId = obj.nutritionistId || null;
      callLog.meetingLink = obj.meetingLink || null;
      callLog.calendarEventId = obj.calendarEventId || null;
      callLog.isSystemGenerated =
        obj.isSystemGenerated !== undefined ? obj.isSystemGenerated : false;
      callLog.active = obj.active !== undefined ? obj.active : true;
      callLog.modifiedBy = adminId;
      callLog.modifiedIp = requestedIp;
      await callLog.save();
    } else {
      // Create new call log
      callLog = await this.memberCallLogRepository.create({
        memberId,
        date: obj.date as any,
        startTime: obj.startTime as any,
        endTime: obj.endTime as any,
        callTypeId: obj.callTypeId,
        callPurposeId: obj.callPurposeId,
        callLogStatusId: obj.callLogStatusId,
        detail: obj.detail || null,
        conversionHistory: obj.conversionHistory || null,
        isMailSuccess: obj.isMailSuccess !== undefined ? obj.isMailSuccess : false,
        nutritionistId: obj.nutritionistId || null,
        meetingLink: obj.meetingLink || null,
        calendarEventId: obj.calendarEventId || null,
        isSystemGenerated: obj.isSystemGenerated !== undefined ? obj.isSystemGenerated : false,
        active: obj.active !== undefined ? obj.active : true,
        createdBy: adminId,
        modifiedBy: adminId,
        createdIp: requestedIp,
        modifiedIp: requestedIp,
      });
    }
    // Fetch the created/updated call log with relations
    const updatedCallLog = await this.memberCallLogRepository.scope('list').findOne({
      where: { memberCallLogId: callLog.memberCallLogId },
      raw: true,
      nest: true,
    });
    return this.convertToModel(updatedCallLog!);
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
      nutritionistId: item.nutritionistId,
      meetingLink: item.meetingLink,
      calendarEventId: item.calendarEventId,
      isSystemGenerated: item.isSystemGenerated,
      active: item.active,
      createdBy: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : (null as any),
      updatedBy: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : (null as any),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      nutritionist: item.nutritionist
        ? CommonFunctionsUtil.getAdminShortInfo(item.nutritionist, 'nutritionist')
        : undefined,
    };
  }

  public async getTimeslots(body: IAvailableSlot): Promise<ICallLogSlot[]> {
    const nutritionist = await this.adminUserRepository.findOne({
      where: { adminId: body.nutritionistId },
    });
    if (!nutritionist?.googleRefreshToken) {
      throw new BadRequestException('Nutritionist calendar not connected');
    }
    return await this.googleService.availableSlots(nutritionist, body);
  }
}
