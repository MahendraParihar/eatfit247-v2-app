import { BelongsTo, Column, CreatedAt, DataType, Index, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude, MstHealthIssue } from '@server/common';
import { TxnMember } from './txn-member.model';
import { InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_member_health_issues',
  schema: 'public',
  tableName: 'txn_member_health_issues',
  indexes: [
    {
      unique: false,
      fields: ['member_id'],
      name: 'ix_txn_member_health_issue_mapping_member_id',
    },
    {
      unique: true,
      fields: ['member_id', 'health_issue_id'],
      name: 'ix_uq_txn_member_health_issue_mapping_hi_id',
    },
  ],
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstHealthIssue,
        as: 'healthIssue',
        required: false,
        attributes: ['healthIssueId', 'healthIssue'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstHealthIssue,
        as: 'healthIssue',
        required: false,
        attributes: ['healthIssueId', 'healthIssue', 'imagePath', 'active'],
      },
    ],
  },
}))
export class TxnMemberHealthIssue extends Model<TxnMemberHealthIssue> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_health_issue_id',
    autoIncrement: true,
  })
  declare memberHealthIssueId: number;

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
    field: 'health_issue_id',
    type: DataType.INTEGER,
  })
  declare healthIssueId: number;

  @BelongsTo(() => MstHealthIssue, {
    foreignKey: 'healthIssueId',
    targetKey: 'healthIssueId',
    as: 'healthIssue',
  })
  declare healthIssue: MstHealthIssue;

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
    allowNull: true,
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
    allowNull: true,
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

  @Column({
    allowNull: false,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare modifiedIp: string;
}
