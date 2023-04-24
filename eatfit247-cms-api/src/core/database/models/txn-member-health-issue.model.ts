import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { TxnMember } from './txn-member.model';
import { MstHealthIssues } from './mst-health-issues.model';

@Table({
  modelName: 'txn_member_health_issue',
  schema: 'public',
  indexes: [
    {
      unique: true,
      fields: ['member_id', 'health_issue_id'],
      name: 'ix_uq_txn_member_health_issue_mapping_hi_id',
    },
    {
      unique: false,
      fields: ['member_id'],
      name: 'ix_txn_member_health_issue_mapping_member_id',
    },
  ],
})
export class TxnMemberHealthIssue extends Model<TxnMemberHealthIssue> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_health_issue_id',
    autoIncrement: true,
  })
  memberHealthIssueId: number;

  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'MemberHealthIssue',
  })
  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  memberId: number;

  @BelongsTo(() => MstHealthIssues, {
    foreignKey: 'healthIssueId',
    targetKey: 'healthIssueId',
    as: 'HealthIssueMemberMap',
    // uniqueKey:"fk_txn_member_pocket_guides_mst_pocket_guides_id"
  })
  @Column({
    allowNull: false,
    field: 'health_issue_id',
    type: DataType.INTEGER,
  })
  healthIssueId: number;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'createdBy',
    targetKey: 'adminId',
    as: 'CreatedBy',
  })
  @Column({
    allowNull: true,
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
    allowNull: true,
    field: 'modified_by',
  })
  modifiedBy: number;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  updatedAt: Date;

  @Column({
    allowNull: false,
    field: 'created_ip',
  })
  createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
  })
  modifiedIp: string;
}
