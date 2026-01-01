import { BelongsTo, Column, CreatedAt, DataType, Index, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { TxnMemberHealthParameterLog } from './txn-member-health-parameter-log.model';
import { MstHealthParameter, MstHealthParameterUnit } from '@server_1/modules/assessment';

@Table({
  freezeTableName: true,
  modelName: 'txn_member_health_parameters',
  schema: 'public',
  timestamps: false,
  tableName: 'txn_member_health_parameters',
  indexes: [
    {
      unique: true,
      fields: ['member_health_parameter_log_id', 'health_parameter_id'],
      name: 'ix_uq_txn_member_health_parameters_member_id_hp_id',
    },
  ],
})
@Scopes(() => ({
  list: {
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
  details: {
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
}))
export class TxnMemberHealthParameter extends Model<TxnMemberHealthParameter> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_health_parameter_id',
    autoIncrement: true,
  })
  declare memberHealthParameterId: number;
  @BelongsTo(() => TxnMemberHealthParameterLog, {
    foreignKey: 'memberHealthParameterLogId',
    targetKey: 'memberHealthParameterLogId',
    as: 'healthParameterLog',
  })
  declare healthParameterLog: TxnMemberHealthParameterLog;
  @Column({
    allowNull: false,
    field: 'member_health_parameter_log_id',
    type: DataType.INTEGER,
  })
  declare memberHealthParameterLogId: number;
  @Column({
    allowNull: false,
    field: 'health_parameter_id',
    type: DataType.INTEGER,
  })
  declare healthParameterId: number;
  @Column({
    allowNull: false,
    field: 'value',
    type: DataType.STRING(20),
  })
  declare value: string;
  @Column({
    allowNull: true,
    field: 'health_parameter_unit_id',
    type: DataType.INTEGER,
  })
  declare healthParameterUnitId: number;
  @BelongsTo(() => MstHealthParameter, {
    foreignKey: 'healthParameterId',
    targetKey: 'healthParameterId',
    as: 'healthParameter',
  })
  declare healthParameter: MstHealthParameter;
  @BelongsTo(() => MstHealthParameterUnit, {
    foreignKey: 'healthParameterUnitId',
    targetKey: 'healthParameterUnitId',
    as: 'healthParameterUnit',
  })
  declare healthParameterUnit: MstHealthParameterUnit;
}
