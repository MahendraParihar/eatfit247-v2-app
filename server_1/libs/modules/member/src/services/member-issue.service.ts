import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMemberIssue, TxnMember } from '../models';
import { IDropdownItem, IIssueMasterData, IMemberIssue } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil } from '@server_1/core';
import { MstIssueCategory, MstIssueStatus } from '@server_1/modules/issues';
import { CreateMemberIssueDto } from '../dto';

@Injectable()
export class MemberIssueService {
  constructor(
    @InjectModel(TxnMemberIssue)
    private readonly memberIssueRepository: typeof TxnMemberIssue,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(MstIssueStatus) private readonly issueStatus: typeof MstIssueStatus,
    @InjectModel(MstIssueCategory) private readonly issueCategory: typeof MstIssueCategory,
  ) {}

  public async getIssuesMasterData(): Promise<IIssueMasterData> {
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
    return <IIssueMasterData>{
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
}
