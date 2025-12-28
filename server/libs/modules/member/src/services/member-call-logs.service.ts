import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMemberCallLog, TxnMember } from '../models';
import {
  CommonFunctionsUtil,
  MstCallType,
  MstCallPurpose,
  MstCallLogStatus,
  MstAdminUser,
  GoogleService, ZoomService,
} from '@server/common';
import {
  IMemberCallLog,
  ITableList,
  IBasicSearch,
  IManageMemberCallLog,
  ICallLogMasterData, IAvailableSlot, ICallLogSlot, ISetupMemberCallLog, ICancelCallLog, CallLogStatusEnum,
  IGoogleCalendarEvent, IZoomEvent, CallTypeEnum,
} from 'eatfit247-shared-lib';
import { Op } from 'sequelize';
import moment from 'moment';

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
    private readonly zoomService: ZoomService,
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
    const durations = [
      { id: 15, label: '15 minutes', selected: false },
      { id: 30, label: '30 minutes', selected: false },
      { id: 45, label: '45 minutes', selected: false },
      { id: 60, label: '1 hour', selected: false },
      { id: 90, label: '1.5 hours', selected: false },
      { id: 120, label: '2 hours', selected: false },
    ];
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
  public async create(
    memberId: number,
    obj: ISetupMemberCallLog,
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
    const nutritionist = await this.adminUserRepository.findOne({
      where: { adminId: obj.nutritionistId },
    });
    if (!nutritionist?.googleRefreshToken) {
      throw new BadRequestException('Nutritionist calendar not connected');
    }
    // checking slots still present or not
    const dateRange = {
      start: moment(obj.startTime).toISOString(),
      end: moment(obj.endTime).toISOString(),
    };
    await this.googleService.checkSlots(nutritionist, dateRange);
    const resObj: { google: IGoogleCalendarEvent; zoom: IZoomEvent; } = { google: null, zoom: null };
    let meetingLink: string | null = null;
    let zoomMeetingId: string | null = null;
    if (obj.callTypeId === CallTypeEnum.ZOOM_CALL) {
      const zoom = await this.zoomService.bookMeeting('Nutrition Consultation', dateRange);
      meetingLink = zoom.join_url;
      resObj.zoom = zoom;
    }
    if (obj.callTypeId === CallTypeEnum.GOOGLE_MEET) {
      resObj.google = await this.googleService.bookSlot(
        nutritionist,
        true,
        meetingLink,
        'mahendra.parihar10@gmail.com',
        obj.notifyUser,
        dateRange,
      );
    }
    let callLog: TxnMemberCallLog;
    // Create a new call log
    callLog = await this.memberCallLogRepository.create({
      memberId,
      startTime: obj.startTime,
      endTime: obj.endTime,
      callTypeId: obj.callTypeId,
      callPurposeId: obj.callPurposeId,
      callLogStatusId: CallLogStatusEnum.PENDING,
      detail: resObj,
      conversionHistory: null,
      isMailSuccess: false,
      nutritionistId: obj.nutritionistId,
      meetingLink: meetingLink,
      calendarEventId: resObj.google?.id,
      isSystemGenerated: true,
      active: true,
      createdBy: adminId,
      modifiedBy: adminId,
      createdIp: requestedIp,
      modifiedIp: requestedIp,
    });
    // Fetch the created/updated call log with relations
    const updatedCallLog = await this.memberCallLogRepository.scope('list').findOne({
      where: { memberCallLogId: callLog.memberCallLogId },
      raw: true,
      nest: true,
    });
    return this.convertToModel(updatedCallLog!);
  }

  public async cancel(payload: ICancelCallLog, requestedIp: string, adminId: number) {
    const meeting = await this.memberCallLogRepository.findOne({
      where: {
        memberCallLogId: payload.memberCallLogId,
        active: true,
      },
    });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    if (meeting.callLogStatusId === CallLogStatusEnum.CANCELLED) {
      return { success: true };
    }
    if (meeting.callTypeId === CallTypeEnum.GOOGLE_MEET && meeting.detail.google?.id) {
      const nutritionist = await this.adminUserRepository.findOne({
        where: { adminId: meeting.nutritionistId },
      });
      try {
        await this.googleService.cancelSlot(nutritionist, meeting.detail.google);
      } catch (e) {
        // Google returns 410 if already deleted — safe to ignore
        if (e.code !== 410) {
          throw e;
        }
      }
    }
    if (
      meeting.callTypeId === CallTypeEnum.ZOOM_CALL &&
      (meeting.detail['zoom'] as IZoomEvent).id
    ) {
      try {
        await this.zoomService.deleteMeeting(meeting.detail['zoom'] as IZoomEvent);
      } catch (e) {
        // Zoom 404 = already deleted → safe
      }
    }
    await this.memberCallLogRepository.update(
      {
        callLogStatusId: CallLogStatusEnum.CANCELLED,
        conversionHistory: payload.reason ?? null,
        modifiedBy: adminId,
        modifiedIp: requestedIp,
      },
      {
        where: { memberCallLogId: payload.memberCallLogId },
      },
    );
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
