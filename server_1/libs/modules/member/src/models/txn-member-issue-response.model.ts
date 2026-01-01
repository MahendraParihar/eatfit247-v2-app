import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude } from '@server_1/core';
import { TxnMemberIssue } from './txn-member-issue.model';

// Note: TxnMemberIssue will be imported via SequelizeModule.forFeature

@Table({
  freezeTableName: true,
  modelName: 'txn_member_issue_responses',
  schema: 'public',
  tableName: 'txn_member_issue_responses',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
}))
export class TxnMemberIssueResponse extends Model<TxnMemberIssueResponse> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_issue_response_id',
    autoIncrement: true,
  })
  declare memberIssueResponseId: number;

  @BelongsTo(() => TxnMemberIssue, {
    foreignKey: 'memberIssueId',
    targetKey: 'memberIssueId',
    as: 'memberIssue',
  })
  declare memberIssue: TxnMemberIssue;

  @Column({
    allowNull: false,
    field: 'member_issue_id',
    type: DataType.INTEGER,
  })
  declare memberIssueId: number;

  @Column({
    allowNull: false,
    field: 'response',
    type: DataType.STRING(1000),
  })
  declare response: string;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'is_latest',
    type: DataType.BOOLEAN,
  })
  declare isLatest: boolean;

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
