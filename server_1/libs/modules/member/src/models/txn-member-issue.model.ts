import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { MstIssueCategory, MstIssueStatus } from '@server_1/modules/issues';
import { TxnMember } from './txn-member.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_member_issues',
  schema: 'public',
  tableName: 'txn_member_issues',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
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
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
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
    ],
  },
}))
export class TxnMemberIssue extends Model<TxnMemberIssue> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_issue_id',
    autoIncrement: true,
  })
  declare memberIssueId: number;

  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'member',
  })
  declare member: TxnMember;

  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  declare memberId: number;

  @Column({
    allowNull: false,
    field: 'issue',
    type: DataType.STRING(1000),
  })
  declare issue: string;

  @Column({
    allowNull: false,
    field: 'issue_status_id',
    type: DataType.INTEGER,
  })
  declare issueStatusId: number;

  @BelongsTo(() => MstIssueStatus, {
    foreignKey: 'issueStatusId',
    targetKey: 'issueStatusId',
    as: 'issueStatus',
  })
  declare issueStatus: MstIssueStatus;

  @Column({
    allowNull: false,
    field: 'issue_category_id',
    type: DataType.INTEGER,
  })
  declare issueCategoryId: number;

  @BelongsTo(() => MstIssueCategory, {
    foreignKey: 'issueCategoryId',
    targetKey: 'issueCategoryId',
    as: 'issueCategory',
  })
  declare issueCategory: MstIssueCategory;

  @BelongsTo(() => MstAdminUser, {
    as: 'createdByUser',
    foreignKey: 'createdBy',
    targetKey: 'adminId',
  })
  declare createdByUser: MstAdminUser;

  @BelongsTo(() => MstAdminUser, {
    as: 'updatedByUser',
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
  })
  declare updatedByUser: MstAdminUser;

  @Column({
    allowNull: false,
    field: 'created_by',
    type: DataType.INTEGER,
  })
  declare createdBy: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;

  @Column({
    allowNull: false,
    field: 'modified_by',
    type: DataType.INTEGER,
  })
  declare modifiedBy: number;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  declare updatedAt: Date;
}
