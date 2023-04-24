import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstIssueCategory } from './mst-issue-category.model';
import { MstIssueStatus } from './mst-issue-status.model';
import { TxnMember } from './txn-member.model';

@Table({
  modelName: 'txn_member_issues',
  schema: 'public',
  indexes: [
    {
      unique: false,
      fields: ['sequence'],
      name: 'ix_txn_member_issues_sequence',
    },
  ],
})
export class TxnMemberIssue extends Model<TxnMemberIssue> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_issue_id',
    autoIncrement: true,
  })
  memberIssueId: number;

  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'IssueMember',
  })
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
    field: 'member_id',
  })
  memberId: number;

  @BelongsTo(() => MstIssueCategory, {
    foreignKey: 'issueCategoryId',
    targetKey: 'issueCategoryId',
    as: 'MemberIssueCategory',
  })
  @Column({
    allowNull: false,
    field: 'issue_category_id',
    type: DataType.INTEGER,
  })
  issueCategoryId: number;

  @BelongsTo(() => MstIssueStatus, {
    foreignKey: 'issueStatusId',
    targetKey: 'issueStatusId',
    as: 'MemberIssueStatus',
  })
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
    field: 'issue_status_id',
  })
  issueStatusId: number;

  @Column({
    allowNull: false,
    type: DataType.STRING(1000),
    field: 'issue',
  })
  issue: string;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'createdBy',
    targetKey: 'adminId',
    as: 'CreatedBy',
  })
  @Column({
    allowNull: false,
    field: 'created_by',
  })
  createdBy: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  createdAt: Date;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
    as: 'ModifiedBy',
  })
  @Column({
    allowNull: false,
    field: 'modified_by',
  })
  modifiedBy: number;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  updatedAt: Date;
}
