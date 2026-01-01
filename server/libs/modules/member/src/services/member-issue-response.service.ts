import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { TxnMemberIssueResponse, TxnMemberIssue } from '../models';
import { IMemberIssueResponse, IMemberIssue } from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, MstIssueStatus } from '@server/common';
import { Op } from 'sequelize';

@Injectable()
export class MemberIssueResponseService {
  constructor(
    @InjectModel(TxnMemberIssueResponse)
    private readonly memberIssueResponseRepository: typeof TxnMemberIssueResponse,
    @InjectModel(TxnMemberIssue)
    private readonly memberIssueRepository: typeof TxnMemberIssue,
    @InjectModel(MstIssueStatus) private readonly issueStatusRepository: typeof MstIssueStatus,
    private sequelize: Sequelize,
  ) {}

  /**
   * Get all responses for a member issue
   * @param memberIssueId - Member issue ID
   * @returns Array of issue responses
   */
  public async findByMemberIssueId(memberIssueId: number): Promise<IMemberIssueResponse[]> {
    // Verify issue exists
    const issue = await this.memberIssueRepository.findByPk(memberIssueId);
    if (!issue) {
      throw new NotFoundException('Member issue not found');
    }
    // Fetch responses with nested relationships
    const records = await this.memberIssueResponseRepository.scope('details').findAll({
      where: { memberIssueId },
      order: [['createdAt', 'ASC']], // Oldest first for chat-like display
      raw: false,
      nest: true,
    });
    return records.map((item: TxnMemberIssueResponse) => this.convertToModel(item.toJSON()));
  }

  /**
   * Create a new response for a member issue
   * @param memberIssueId - Member issue ID
   * @param response - Response text
   * @param adminId - Admin user ID
   * @returns Created response
   */
  public async create(
    memberIssueId: number,
    response: string,
    adminId: number,
  ): Promise<IMemberIssueResponse> {
    // Verify issue exists
    const issue = await this.memberIssueRepository.findByPk(memberIssueId);
    if (!issue) {
      throw new NotFoundException('Member issue not found');
    }
    const transaction = await this.sequelize.transaction();
    try {
      // If this is marked as latest, unmark all previous responses as not latest
      await this.memberIssueResponseRepository.update(
        { isLatest: false },
        {
          where: { memberIssueId: memberIssueId },
          transaction,
        },
      );
      // Create the response
      const newResponse = await this.memberIssueResponseRepository.create(
        {
          memberIssueId: memberIssueId,
          response: response,
          isLatest: true,
          createdBy: adminId,
          modifiedBy: adminId,
        },
        { transaction },
      );
      await transaction.commit();
      // Fetch with relationships
      const createdResponse = await this.memberIssueResponseRepository
        .scope('details')
        .findByPk(newResponse.memberIssueResponseId);
      if (!createdResponse) {
        throw new NotFoundException('Failed to retrieve created response');
      }
      return this.convertToModel(createdResponse.toJSON());
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Mark issue as solved (closed) or in progress
   * @param memberIssueId - Member issue ID
   * @param isSolved - Whether the issue is solved
   * @param adminId - Admin user ID
   * @returns Updated issue
   */
  public async markAsSolved(
    memberIssueId: number,
    isSolved: boolean,
    adminId: number,
  ): Promise<IMemberIssue> {
    // Verify issue exists
    const issue = await this.memberIssueRepository.findByPk(memberIssueId);
    if (!issue) {
      throw new NotFoundException('Member issue not found');
    }
    // Find the appropriate status
    // Assuming status names like "Closed", "Resolved", "In Progress", "Open"
    let targetStatus: MstIssueStatus | null = null;
    if (isSolved) {
      // Try to find "Closed" or "Resolved" status
      targetStatus = await this.issueStatusRepository.findOne({
        where: {
          active: true,
          issueStatus: {
            [Op.iLike]: '%closed%',
          },
        },
      });
      if (!targetStatus) {
        targetStatus = await this.issueStatusRepository.findOne({
          where: {
            active: true,
            issueStatus: {
              [Op.iLike]: '%resolved%',
            },
          },
        });
      }
    } else {
      // Try to find "In Progress" status
      targetStatus = await this.issueStatusRepository.findOne({
        where: {
          active: true,
          issueStatus: {
            [Op.iLike]: '%progress%',
          },
        },
      });
    }
    if (!targetStatus) {
      throw new NotFoundException(
        `Could not find appropriate issue status for ${isSolved ? 'closed' : 'in progress'}`,
      );
    }
    // Update issue status
    await issue.update({
      issueStatusId: targetStatus.issueStatusId,
      modifiedBy: adminId,
    });
    // Fetch with relationships
    const updatedIssue = await this.memberIssueRepository.scope('details').findByPk(memberIssueId);
    if (!updatedIssue) {
      throw new NotFoundException('Failed to retrieve updated issue');
    }
    return {
      memberIssueId: updatedIssue.memberIssueId,
      memberId: updatedIssue.memberId,
      issue: updatedIssue.issue,
      issueStatusId: updatedIssue.issueStatusId,
      issueCategoryId: updatedIssue.issueCategoryId,
      issueStatus: updatedIssue.issueStatus.issueStatus,
      issueCategory: updatedIssue.issueCategory.issueCategory,
      createdBy: updatedIssue.createdBy,
      updatedBy: updatedIssue.modifiedBy,
      createdAt: updatedIssue.createdAt,
      updatedAt: updatedIssue.updatedAt,
      createdByUser: updatedIssue.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(updatedIssue.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: updatedIssue.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(updatedIssue.updatedByUser, 'updatedByUser')
        : undefined,
    };
  }

  private convertToModel(item: any): IMemberIssueResponse {
    return {
      memberIssueResponseId: item.memberIssueResponseId,
      memberIssueId: item.memberIssueId,
      response: item.response,
      isLatest: item.isLatest,
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
