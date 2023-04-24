import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { TxnMember } from './txn-member.model';

@Table({
  modelName: 'txn_member_health_parameter_logs',
  schema: 'public',
  indexes: [
    {
      unique: true,
      fields: ['member_id', 'log_date'],
      name: 'ix_uq_txn_member_health_parameter_logs_member_id_date',
    },
  ],
})
export class TxnMemberHealthParameterLog extends Model<TxnMemberHealthParameterLog> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_health_parameter_log_id',
    autoIncrement: true,
  })
  memberHealthParameterLogId: number;

  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'MemberHealthParameterLog',
  })
  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  memberId: number;

  @Column({
    allowNull: false,
    field: 'log_date',
    type: DataType.DATEONLY,
  })
  logDate: Date;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
  })
  active: boolean;

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
