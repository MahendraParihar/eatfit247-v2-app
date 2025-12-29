import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMemberCallLog, TxnMember } from '../models';
import {
  CommonFunctionsUtil,
  MstCallType,
  MstCallPurpose,
  MstCallLogStatus,
  MstAdminUser,
  GoogleService, ZoomService, AppConfigService,
} from '@server/common';
import {
  IMemberCallLog,
  ITableList,
  IBasicSearch,
  ICallLogMasterData,
  IAvailableSlot,
  ICallLogSlot,
  ISetupMemberCallLog,
  CallLogStatusEnum,
  IGoogleCalendarEvent,
  IZoomEvent,
  CallTypeEnum,
  ConfigParam,
  IDropdownItem,
  IStatusChangeCallLog,
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
    private readonly appConfigService: AppConfigService,
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
      order: [['startTime', 'DESC']],
      raw: true,
      nest: true,
    });
    return records.map((item: TxnMemberCallLog) => this.convertToModel(item));
  }

  /**
   * Get master data for call log form (call types, purposes, statuses, nutritionists)
   */
  /**
   * Generate duration options dynamically based on slot step minutes
   * @param slotStepMinutes - The step size in minutes (e.g., 15)
   * @param count - Number of durations to generate (default: 10)
   * @returns Array of duration dropdown items
   */
  private generateDurations(slotStepMinutes: number, count: number = 10): IDropdownItem[] {
    const durations: IDropdownItem[] = [];
    for (let i = 1; i <= count; i++) {
      const minutes = slotStepMinutes * i;
      let label: string;
      if (minutes < 60) {
        label = `${minutes} minutes`;
      } else if (minutes === 60) {
        label = '1 hour';
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes === 0) {
          label = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
        } else {
          // Format as hours and minutes (e.g., "1 hour 30 minutes" or "2 hours 15 minutes")
          const hoursLabel = hours === 1 ? 'hour' : 'hours';
          const minutesLabel = remainingMinutes === 1 ? 'minute' : 'minutes';
          label = `${hours} ${hoursLabel} ${remainingMinutes} ${minutesLabel}`;
        }
      }
      durations.push({
        id: minutes,
        label: label,
        selected: false,
      });
    }
    return durations;
  }

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
    const slotStepMinutes = this.appConfigService.getNumber(
      ConfigParam.CALENDAR_SLOT_STEP_MINUTES,
      true,
      15,
    );
    const durations = this.generateDurations(slotStepMinutes, 10);
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
    const resObj: { google: IGoogleCalendarEvent; zoom: IZoomEvent } = { google: null, zoom: null };
    let meetingLink: string | null = null;
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

  public async cancel(payload: IStatusChangeCallLog, requestedIp: string, adminId: number) {
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

  public async complete(payload: IStatusChangeCallLog, requestedIp: string, adminId: number) {
    const meeting = await this.memberCallLogRepository.findOne({
      where: {
        memberCallLogId: payload.memberCallLogId,
        active: true,
      },
    });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    if (meeting.callLogStatusId === CallLogStatusEnum.COMPLETED) {
      return { success: true };
    }
    if (meeting.callLogStatusId === CallLogStatusEnum.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled call log');
    }
    await this.memberCallLogRepository.update(
      {
        callLogStatusId: CallLogStatusEnum.COMPLETED,
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
      memberName: memberName,
      memberFirstName: memberFirstName,
      memberLastName: memberLastName,
      memberEmail: item.member?.emailId,
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
