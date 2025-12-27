import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize as SequelizeLib } from 'sequelize';
import { TxnMemberHealthIssue, TxnMember } from '../models';
import { IMemberHealthIssue } from 'eatfit247-shared-lib';
import { CommonFunctionsUtil, MstHealthIssue } from '@server/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class MemberHealthIssueService {
  constructor(
    @InjectModel(TxnMemberHealthIssue)
    private readonly memberHealthIssueRepository: typeof TxnMemberHealthIssue,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(MstHealthIssue) private readonly healthIssueRepository: typeof MstHealthIssue,
    private sequelize: Sequelize,
  ) {}

  /**
   * Get list of all health issues with selection flag for a member
   * @param memberId - Member ID
   * @returns Array of health issues with selected flag
   */
  public async getList(
    memberId: number,
  ): Promise<Array<{ healthIssueId: number; healthIssue: string; selected: boolean }>> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Get all active health issues with a selection flag using a Sequelize query with subquery
    const allHealthIssues = await this.healthIssueRepository.findAll({
      where: { active: true },
      attributes: [
        'healthIssueId',
        'healthIssue',
        [
          SequelizeLib.literal(`(
            SELECT CASE 
              WHEN EXISTS (
                SELECT 1 
                FROM txn_member_health_issues tmhi 
                WHERE tmhi.health_issue_id = "MstHealthIssue"."health_issue_id" 
                AND tmhi.member_id = ${memberId}
              ) THEN true 
              ELSE false 
            END
          )`),
          'selected',
        ],
      ],
      order: [['healthIssue', 'ASC']],
      raw: true,
      nest: true,
    });
    return allHealthIssues.map((hi: any) => ({
      healthIssueId: hi.healthIssueId,
      healthIssue: hi.healthIssue,
      selected: hi.selected === true || hi.selected === 1,
    }));
  }

  /**
   * Manage health issues for a member (create/update associations)
   * @param memberId - Member ID
   * @param healthIssueIds - Array of health issue IDs to associate with member
   * @param cIp - Client IP
   * @param adminId - Admin user ID
   */
  public async manage(
    memberId: number,
    healthIssueIds: number[],
    cIp: string,
    adminId: number,
  ): Promise<void> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Validate health issue IDs exist and are active
    if (healthIssueIds.length > 0) {
      const validHealthIssues = await this.healthIssueRepository.findAll({
        where: {
          healthIssueId: {
            [Op.in]: healthIssueIds,
          },
          active: true,
        },
        attributes: ['healthIssueId'],
        raw: true,
      });
      const validIds = new Set(validHealthIssues.map((hi: any) => hi.healthIssueId));
      const invalidIds = healthIssueIds.filter((id) => !validIds.has(id));
      if (invalidIds.length > 0) {
        throw new NotFoundException(
          `Invalid or inactive health issue IDs: ${invalidIds.join(', ')}`,
        );
      }
    }
    // Use transaction for atomic operation
    const transaction = await this.sequelize.transaction();
    try {
      // Remove existing associations
      await this.memberHealthIssueRepository.destroy({
        where: { memberId },
        transaction,
      });
      // Create new associations
      if (healthIssueIds.length > 0) {
        const createData = healthIssueIds.map((healthIssueId) => ({
          memberId,
          healthIssueId,
          createdBy: adminId,
          modifiedBy: adminId,
          createdIp: cIp,
          modifiedIp: cIp,
        }));
        await this.memberHealthIssueRepository.bulkCreate(createData, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all health issues for a member
   * @param memberId - Member ID
   * @returns Array of member health issues
   */
  public async findByMemberId(memberId: number): Promise<IMemberHealthIssue[]> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Fetch health issues with nested relationships using Sequelize joins
    const records = await this.memberHealthIssueRepository.scope('details').findAll({
      where: { memberId },
      order: [['healthIssueId', 'ASC']],
      raw: false,
      nest: true,
    });
    return records.map((item) => this.convertToModel(item.toJSON()));
  }

  private convertToModel(item: any): IMemberHealthIssue {
    return {
      memberHealthIssueId: item.memberHealthIssueId,
      memberId: item.memberId,
      healthIssueId: item.healthIssueId,
      healthIssue: item.healthIssue?.healthIssue || '',
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
