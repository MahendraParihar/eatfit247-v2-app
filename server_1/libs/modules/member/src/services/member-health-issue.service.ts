import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { TxnMember, TxnMemberHealthIssue } from '../models';
import { IMemberHealthIssue, ITableList } from '@eatfit247-shared-lib';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, CommonFunctionsUtil, MstAdminUser } from '@server_1/core';
import { MstHealthIssue } from '@server_1/modules/assessment';
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
   * @param required - Whether to require existing associations
   * @returns Table list of health issues with selected flag
   */
  public async getList(
    memberId: number,
    required: boolean = false,
  ): Promise<ITableList<IMemberHealthIssue>> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    MstHealthIssue.belongsTo(TxnMemberHealthIssue, {
      targetKey: 'healthIssueId',
      foreignKey: 'healthIssueId',
    });
    const { rows, count } = await this.healthIssueRepository.findAndCountAll({
      include: [
        {
          attributes: ['memberHealthIssueId', 'createdAt', 'updatedAt'],
          model: TxnMemberHealthIssue,
          required: required,
          where: {
            memberId: memberId,
          },
          include: [
            {
              model: MstAdminUser,
              required: false,
              as: 'createdByUser',
              attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
            },
            {
              model: MstAdminUser,
              required: false,
              as: 'updatedByUser',
              attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
            },
          ],
        },
      ],
      where: {
        active: true,
      },
      order: [['healthIssue', 'ASC']],
      raw: true,
      nest: true,
    });
    return <ITableList<IMemberHealthIssue>>{
      count: count,
      tableData: rows.map((item: any) => this.convertToModel(item, memberId)),
    };
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
    return records.map((item) => {
      const json = item.toJSON();
      return {
        memberHealthIssueId: json.memberHealthIssueId,
        memberId: json.memberId,
        healthIssueId: json.healthIssueId,
        healthIssue: json.healthIssue?.healthIssue || '',
        createdBy: json.createdBy,
        updatedBy: json.modifiedBy,
        createdAt: json.createdAt,
        updatedAt: json.updatedAt,
        createdByUser: json.createdByUser
          ? CommonFunctionsUtil.getAdminShortInfo(json.createdByUser, 'createdByUser')
          : undefined,
        updatedByUser: json.updatedByUser
          ? CommonFunctionsUtil.getAdminShortInfo(json.updatedByUser, 'updatedByUser')
          : undefined,
      };
    });
  }

  private convertToModel(item: any, memberId: number): IMemberHealthIssue {
    const txnMemberHealthIssue = item['txn_member_health_issue'];
    return {
      memberId: memberId,
      memberHealthIssueId: txnMemberHealthIssue?.memberHealthIssueId,
      healthIssueId: item.healthIssueId,
      healthIssue: item.healthIssue,
      isSelected: !!txnMemberHealthIssue?.memberHealthIssueId,
      createdBy: txnMemberHealthIssue?.createdBy,
      updatedBy: txnMemberHealthIssue?.modifiedBy,
      createdAt: txnMemberHealthIssue?.createdAt,
      updatedAt: txnMemberHealthIssue?.updatedAt,
      createdByUser: txnMemberHealthIssue?.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(txnMemberHealthIssue.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: txnMemberHealthIssue?.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(txnMemberHealthIssue.updatedByUser, 'updatedByUser')
        : undefined,
    };
  }
}
