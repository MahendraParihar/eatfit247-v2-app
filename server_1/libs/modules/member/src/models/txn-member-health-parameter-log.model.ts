import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Index,
  Model,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  MstAdminUser,
  getCreatedByUserInclude,
  getUpdatedByUserInclude,
} from '@server_1/core';
import { MstHealthParameter, MstHealthParameterUnit } from '@server_1/modules/assessment';
import { TxnMember } from './txn-member.model';
import { TxnMemberHealthParameter } from './txn-member-health-parameter.model';
import { InputLengthEnum } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_member_health_parameter_logs',
  schema: 'public',
  tableName: 'txn_member_health_parameter_logs',
  indexes: [
    {
      unique: true,
      fields: ['member_id', 'log_date'],
      name: 'ix_uq_txn_member_health_parameter_logs_member_id_date',
    },
  ],
})
@Scopes(() => ({
  list: {
    include: [getCreatedByUserInclude(false), getUpdatedByUserInclude(false)],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: TxnMemberHealthParameter,
        as: 'healthParameters',
        required: false,
        separate: true,
        order: [['healthParameterId', 'ASC']],
        include: [
          {
            model: MstHealthParameter,
            as: 'healthParameter',
            required: false,
            attributes: ['healthParameterId', 'healthParameter'],
          },
          {
            model: MstHealthParameterUnit,
            as: 'healthParameterUnit',
            required: false,
            attributes: ['healthParameterUnitId', 'healthParameterUnit'],
          },
        ],
      },
    ],
  },
}))
export class TxnMemberHealthParameterLog extends Model<TxnMemberHealthParameterLog> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_health_parameter_log_id',
    autoIncrement: true,
  })
  declare memberHealthParameterLogId: number;
  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'member',
  })
  declare member: TxnMember;
  @HasMany(() => TxnMemberHealthParameter, {
    foreignKey: 'memberHealthParameterLogId',
    sourceKey: 'memberHealthParameterLogId',
    as: 'healthParameters',
  })
  declare healthParameters: TxnMemberHealthParameter[];
  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  declare memberId: number;
  @Column({
    allowNull: false,
    field: 'log_date',
    type: DataType.DATEONLY,
  })
  declare logDate: Date;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;
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
