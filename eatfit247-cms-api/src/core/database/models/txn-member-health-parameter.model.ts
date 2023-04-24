import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript';
import { MstHealthParameter } from './mst-health-parameter.model';
import { MstHealthParameterUnit } from './mst-health-parameter-unit.model';
import { TxnMemberHealthParameterLog } from './txn-member-health-parameter-log.model';

@Table({
  modelName: 'txn_member_health_parameters',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['member_health_parameter_log_id', 'health_parameter_id'],
      name: 'ix_uq_txn_member_health_parameters_member_id_hp_id',
    },
  ],
})
export class TxnMemberHealthParameter extends Model<TxnMemberHealthParameter> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_health_parameter_id',
    autoIncrement: true,
  })
  memberHealthParameterId: number;

  @BelongsTo(() => TxnMemberHealthParameterLog, {
    foreignKey: 'memberHealthParameterLogId',
    targetKey: 'memberHealthParameterLogId',
    as: 'MemberHealthParameterLog',
  })
  @Column({
    allowNull: false,
    field: 'member_health_parameter_log_id',
    type: DataType.INTEGER,
  })
  memberHealthParameterLogId: number;

  @BelongsTo(() => MstHealthParameter, {
    foreignKey: 'healthParameterId',
    targetKey: 'healthParameterId',
    as: 'MemberHealthParameterParameter',
  })
  @Column({
    allowNull: false,
    field: 'health_parameter_id',
    type: DataType.INTEGER,
  })
  healthParameterId: number;

  @BelongsTo(() => MstHealthParameterUnit, {
    foreignKey: 'healthParameterUnitId',
    targetKey: 'healthParameterUnitId',
    as: 'MemberHealthParameterParameterUnit',
  })
  @Column({
    allowNull: true,
    field: 'health_parameter_unit_id',
    type: DataType.INTEGER,
  })
  healthParameterUnitId: number;

  @Column({
    allowNull: false,
    field: 'value',
    type: DataType.STRING(20),
  })
  value: string;
}
