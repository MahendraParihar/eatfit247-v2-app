import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { TxnMemberIssue } from './txn-member-issue.model';

@Table({
  modelName: 'txn_member_issue_responses',
  schema: 'public',
  indexes: [
    {
      unique: false,
      fields: ['sequence'],
      name: 'ix_txn_member_issue_responses_sequence',
    },
  ],
})
export class TxnMemberIssueResponse extends Model<TxnMemberIssueResponse> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_issue_response_id',
    autoIncrement: true,
  })
  memberIssueResponseId: number;

  @BelongsTo(() => TxnMemberIssue, {
    foreignKey: 'memberIssueId',
    targetKey: 'memberIssueId',
    as: 'MemberIssue',
  })
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
    field: 'member_issue_id',
  })
  memberIssueId: number;

  @Column({
    allowNull: false,
    type: DataType.STRING(1000),
    field: 'response',
  })
  response: string;

  @Column({
    allowNull: false,
    field: 'is_latest',
    defaultValue: true,
    type: DataType.BOOLEAN,
  })
  isLatest: boolean;

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
