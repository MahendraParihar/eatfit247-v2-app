import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnMemberIssue, TxnMember } from '../models';
import { IMemberIssue } from 'eatfit247-shared-lib';
import { CommonFunctionsUtil } from '@server/common';

@Injectable()
export class MemberIssueService {
  constructor(
    @InjectModel(TxnMemberIssue)
    private readonly memberIssueRepository: typeof TxnMemberIssue,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
  ) {}

  /**
   * Get all issues for a member
   * @param memberId - Member ID
   * @returns Array of member issues
   */
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

  private convertToModel(item: TxnMemberIssue): IMemberIssue {
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
