import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { TxnMember, TxnMemberIssue } from '../models';
import {
  IBasicSearch,
  IDropdownItem,
  IIssue,
  IIssueMasterData,
  IMemberIssue,
  IMemberIssueReportItem,
  ITableList,
} from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, MstAdminUser, ReportSortUtil, TableListSortUtil } from '@server_1/core';
import { MstIssueCategory, MstIssueStatus } from '@server_1/modules/issues';
import { CreateMemberIssueDto, MemberIssueReportDto } from '../dto';
import { TxnMemberIssueResponse } from '../models/txn-member-issue-response.model';
import moment from 'moment';

@Injectable()
export class MemberIssueService {
  private masterDataCache: { data: IIssueMasterData; expiresAt: number } | null = null;
  private static readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  constructor(
    @InjectModel(TxnMemberIssue)
    private readonly memberIssueRepository: typeof TxnMemberIssue,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(MstIssueStatus) private readonly issueStatus: typeof MstIssueStatus,
    @InjectModel(MstIssueCategory) private readonly issueCategory: typeof MstIssueCategory,
    @InjectModel(TxnMemberIssueResponse)
    private readonly memberIssueResponseRepository: typeof TxnMemberIssueResponse,
  ) {}

  public async getIssuesMasterData(): Promise<IIssueMasterData> {
    if (this.masterDataCache && Date.now() < this.masterDataCache.expiresAt) {
      return this.masterDataCache.data;
    }
    const [categories, status] = await Promise.all([
      this.issueCategory.findAll({
        attributes: ['issueCategoryId', 'issueCategory'],
        where: { active: true },
      }),
      this.issueStatus.findAll({
        attributes: ['issueStatusId', 'issueStatus'],
        where: { active: true },
      }),
    ]);
    const result = <IIssueMasterData>{
      categories: categories.map((p) => {
        return <IDropdownItem>{
          id: p.issueCategoryId,
          label: p.issueCategory,
        };
      }),
      status: status.map((p) => {
        return <IDropdownItem>{
          id: p.issueStatusId,
          label: p.issueStatus,
        };
      }),
    };
    this.masterDataCache = { data: result, expiresAt: Date.now() + MemberIssueService.CACHE_TTL_MS };
    return result;
  }

  public async findByMemberId(memberId: number): Promise<IMemberIssue[]> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Fetch issues with nested relationships using Sequelize joins
    const records = await this.memberIssueRepository.scope('details').findAll({
      where: { memberId },
      order: [['createdAt', 'DESC']],
      raw: false,
      nest: true,
    });
    return records.map((item: TxnMemberIssue) => this.convertToModel(item.toJSON()));
  }

  /**
   * Create a new member issue
   * @param dto - Member issue data
   * @param cIp - Client IP
   * @param adminId - Admin user ID
   * @returns Created member issue
   */
  public async create(
    dto: CreateMemberIssueDto,
    cIp: string,
    adminId: number,
  ): Promise<IMemberIssue> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId: dto.memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Create the issue
    const issue = await this.memberIssueRepository.create({
      memberId: dto.memberId,
      issue: dto.issue,
      issueStatusId: dto.issueStatusId,
      issueCategoryId: dto.issueCategoryId,
      createdBy: adminId,
      modifiedBy: adminId,
    });
    // Fetch with relationships
    const createdIssue = await this.memberIssueRepository
      .scope('details')
      .findByPk(issue.memberIssueId);
    if (!createdIssue) {
      throw new NotFoundException('Failed to retrieve created issue');
    }
    return this.convertToModel(createdIssue.toJSON());
  }

  /**
   * Update an existing member issue
   * @param memberIssueId - Member issue ID
   * @param dto - Updated member issue data
   * @param cIp - Client IP
   * @param adminId - Admin user ID
   * @returns Updated member issue
   */
  public async update(
    memberIssueId: number,
    dto: CreateMemberIssueDto,
    cIp: string,
    adminId: number,
  ): Promise<IMemberIssue> {
    // Verify issue exists
    const existingIssue = await this.memberIssueRepository.findByPk(memberIssueId);
    if (!existingIssue) {
      throw new NotFoundException('Member issue not found');
    }
    // Update the issue
    await existingIssue.update({
      issue: dto.issue,
      issueStatusId: dto.issueStatusId,
      issueCategoryId: dto.issueCategoryId,
      modifiedBy: adminId,
    });
    // Fetch with relationships
    const updatedIssue = await this.memberIssueRepository.scope('details').findByPk(memberIssueId);
    if (!updatedIssue) {
      throw new NotFoundException('Failed to retrieve updated issue');
    }
    return this.convertToModel(updatedIssue.toJSON());
  }

  /**
   * Get member issues report with filters
   * @param dto - Member issue report filter DTO
   * @returns List of member issues with member information
   */
  public async getMemberIssuesReport(dto: MemberIssueReportDto): Promise<ITableList<IMemberIssueReportItem>> {
    const startDateStr = moment(dto.startDate).startOf('day').utc().startOf('day');
    const endDateStr = moment(dto.endDate).endOf('day').utc().endOf('day');
    
    const whereCondition: any = {
      createdAt: {
        [Op.and]: {
          [Op.gte]: startDateStr.format(),
          [Op.lte]: endDateStr.format(),
        },
      },
    };

    // Add status filter if provided
    if (dto.issueStatusId) {
      whereCondition.issueStatusId = dto.issueStatusId;
    }

    // Add category filter if provided
    if (dto.issueCategoryId) {
      whereCondition.issueCategoryId = dto.issueCategoryId;
    }

    // Add open/closed filter if provided
    if (dto.isOpen !== undefined) {
      // Assuming open status has a specific status ID or status name contains "open"
      // You may need to adjust this based on your status naming convention
      const openStatuses = await this.issueStatus.findAll({
        where: {
          active: true,
          issueStatus: { [Op.iLike]: '%open%' },
        },
        attributes: ['issueStatusId'],
      });
      const openStatusIds = openStatuses.map((s) => s.issueStatusId);
      if (dto.isOpen) {
        whereCondition.issueStatusId = { [Op.in]: openStatusIds };
      } else {
        whereCondition.issueStatusId = { [Op.notIn]: openStatusIds };
      }
    }

    // Build include conditions
    const includeConditions: any[] = [
      {
        model: TxnMember,
        as: 'member',
        required: true,
        attributes: ['memberId', 'firstName', 'lastName', 'emailId', 'contactNumber'],
      },
      {
        model: MstIssueStatus,
        as: 'issueStatus',
        required: false,
        attributes: ['issueStatusId', 'issueStatus'],
      },
      {
        model: MstIssueCategory,
        as: 'issueCategory',
        required: false,
        attributes: ['issueCategoryId', 'issueCategory'],
      },
      {
        model: MstAdminUser,
        as: 'createdByUser',
        required: false,
        attributes: ['adminId', 'firstName', 'lastName'],
      },
      {
        model: MstAdminUser,
        as: 'updatedByUser',
        required: false,
        attributes: ['adminId', 'firstName', 'lastName'],
      },
    ];

    // Add search condition if provided
    if (dto.search && dto.search.trim()) {
      const searchTerm = `%${dto.search.trim()}%`;
      includeConditions[0].where = {
        [Op.or]: [
          { firstName: { [Op.iLike]: searchTerm } },
          { lastName: { [Op.iLike]: searchTerm } },
          { emailId: { [Op.iLike]: searchTerm } },
          { contactNumber: { [Op.iLike]: searchTerm } },
        ],
      };
    }

    const pageNumber = Math.max(0, Math.floor(Number(dto.page) || 0));
    const pageSize = Math.min(500, Math.max(1, Math.floor(Number(dto.limit) || 50)));
    const { rows, count } = await this.memberIssueRepository.scope('list').findAndCountAll({
      where: whereCondition,
      include: includeConditions,
      order: [['createdAt', 'DESC']],
      offset: pageNumber * pageSize,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    // Get response information for each issue
    const memberIssueIds = rows.map((r: any) => r.memberIssueId || r.member_issue_id).filter((id: any) => id);
    const responses = await this.memberIssueResponseRepository.findAll({
      where: {
        memberIssueId: { [Op.in]: memberIssueIds },
        isLatest: true,
      },
      attributes: ['memberIssueId', 'createdAt'],
      order: [['createdAt', 'DESC']],
      raw: true,
    });

    const responseMap = new Map<number, Date>();
    responses.forEach((r: any) => {
      if (!responseMap.has(r.memberIssueId) || responseMap.get(r.memberIssueId)! < r.createdAt) {
        responseMap.set(r.memberIssueId, r.createdAt);
      }
    });

    // Transform data
    const tableData: IMemberIssueReportItem[] = rows.map((item: any) => {
      // With raw: true and nest: true, nested objects use the alias as key
      const memberIssueId = item.memberIssueId || item.member_issue_id;
      const hasResponse = responseMap.has(memberIssueId);
      const lastResponseDate = responseMap.get(memberIssueId) || null;
      
      const member = item.member || {};
      const issueStatus = item.issueStatus || {};
      const issueCategory = item.issueCategory || {};
      const createdByUser = item.createdByUser || {};
      const updatedByUser = item.updatedByUser || {};

      return {
        memberIssueId,
        memberId: member.memberId || item.memberId || item.member_id,
        memberName: member.firstName && member.lastName
          ? `${member.firstName} ${member.lastName}`.trim()
          : '',
        memberEmail: member.emailId || '',
        memberContactNumber: member.contactNumber || '',
        issue: item.issue,
        issueStatusId: item.issueStatusId || item.issue_status_id,
        issueStatus: issueStatus.issueStatus || '',
        issueCategoryId: item.issueCategoryId || item.issue_category_id,
        issueCategory: issueCategory.issueCategory || '',
        hasResponse,
        lastResponseDate,
        createdAt: item.createdAt || item.created_at,
        updatedAt: item.updatedAt || item.updated_at,
        createdByUser: createdByUser.adminId
          ? {
              adminId: createdByUser.adminId,
              firstName: createdByUser.firstName || '',
              lastName: createdByUser.lastName || '',
            }
          : undefined,
        updatedByUser: updatedByUser.adminId
          ? {
              adminId: updatedByUser.adminId,
              firstName: updatedByUser.firstName || '',
              lastName: updatedByUser.lastName || '',
            }
          : undefined,
      };
    });

    const sortedTable = ReportSortUtil.sortInMemory(tableData, dto.sortBy, dto.sortOrder, {
      memberName: (r) => r.memberName,
      createdAt: (r) => r.createdAt,
    });

    return {
      tableData: sortedTable,
      count,
    };
  }

  /**
   * Paginated list for the global admin Issues screen (`GET /issue/list`).
   * Maps `TxnMemberIssue` rows to {@link IIssue} (subject/issueDate/resolvedDate aliases).
   */
  public async findAllForGlobalIssueAdmin(searchDto: IBasicSearch): Promise<ITableList<IIssue>> {
    const whereCondition: Record<string, unknown> = {};
    if (searchDto.search?.trim()) {
      whereCondition.issue = { [Op.iLike]: `%${searchDto.search.trim()}%` };
    }

    const pageNumber = searchDto.page ?? 0;
    const pageSize = searchDto.limit ?? 15;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    const sortMap: Record<string, string> = {
      issueId: 'memberIssueId',
      subject: 'issue',
      issueDate: 'createdAt',
      resolvedDate: 'updatedAt',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };
    const apiField = TableListSortUtil.resolveField(searchDto);
    const dbField = (apiField && sortMap[apiField]) || apiField;
    const sortPayload: IBasicSearch = {
      ...searchDto,
      sortField: dbField,
      sortBy: dbField,
    };

    const order = TableListSortUtil.orderFromAllowlist(
      sortPayload,
      new Set(['memberIssueId', 'issue', 'createdAt', 'updatedAt']),
      [['createdAt', 'DESC']],
    );

    const { rows, count } = await this.memberIssueRepository.scope('list').findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: TxnMember,
          as: 'member',
          required: false,
          attributes: ['memberId', 'firstName', 'lastName'],
        },
      ],
      order,
      offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    return {
      tableData: rows.map((r) => this.mapRowToIIssue(r as unknown as Record<string, unknown>)),
      count,
    };
  }

  public async getOneForGlobalIssueAdmin(issueId: number): Promise<IIssue> {
    const row = await this.memberIssueRepository.scope('details').findByPk(issueId, {
      include: [
        {
          model: TxnMember,
          as: 'member',
          required: false,
          attributes: ['memberId', 'firstName', 'lastName', 'emailId', 'contactNumber'],
        },
      ],
      raw: true,
      nest: true,
    });
    if (!row) {
      throw new NotFoundException('Issue not found');
    }
    return this.mapRowToIIssue(row as unknown as Record<string, unknown>);
  }

  private mapRowToIIssue(item: Record<string, unknown>): IIssue {
    const issueStatus = item.issueStatus as { issueStatusId?: number; issueStatus?: string } | undefined;
    const issueCategory = item.issueCategory as { issueCategoryId?: number; issueCategory?: string } | undefined;
    const member = item.member as { memberId?: number; firstName?: string; lastName?: string } | undefined;
    const createdByUser = item.createdByUser as Record<string, unknown> | undefined;
    const updatedByUser = item.updatedByUser as Record<string, unknown> | undefined;

    const memberIssueId = Number(item.memberIssueId ?? item.member_issue_id ?? 0);
    const statusLabel = String(issueStatus?.issueStatus ?? '').toLowerCase();
    const resolved = /closed|resolved|solved/.test(statusLabel);

    return {
      issueId: memberIssueId,
      subject: String(item.issue ?? ''),
      issueDate: item.createdAt as Date,
      resolvedDate: resolved ? (item.updatedAt as Date) : undefined,
      issueCategoryId: Number(item.issueCategoryId ?? item.issue_category_id ?? 0),
      issueStatusId: Number(item.issueStatusId ?? item.issue_status_id ?? 0),
      memberId: Number(item.memberId ?? item.member_id ?? member?.memberId ?? 0),
      issueCategory: issueCategory as IIssue['issueCategory'],
      issueStatus: issueStatus as IIssue['issueStatus'],
      member: member
        ? {
            memberId: Number(member.memberId),
            firstName: member.firstName,
            lastName: member.lastName,
          }
        : undefined,
      createdBy: Number(item.createdBy ?? item.created_by),
      modifiedBy: Number(item.modifiedBy ?? item.modified_by),
      createdAt: item.createdAt as Date,
      updatedAt: item.updatedAt as Date,
      createdByUser: createdByUser?.adminId
        ? CommonFunctionsUtil.getAdminShortInfo(createdByUser, 'createdByUser') ?? undefined
        : undefined,
      updatedByUser: updatedByUser?.adminId
        ? CommonFunctionsUtil.getAdminShortInfo(updatedByUser, 'updatedByUser') ?? undefined
        : undefined,
    };
  }

  private convertToModel(item: any): IMemberIssue {
    return {
      memberIssueId: item.memberIssueId,
      memberId: item.memberId,
      issue: item.issue,
      issueStatusId: item.issueStatusId,
      issueCategoryId: item.issueCategoryId,
      issueStatus: item.issueStatus.issueStatus,
      issueCategory: item.issueCategory.issueCategory,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
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
}
