import { BelongsTo, Column, CreatedAt, DataType, Index, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { TxnMemberHealthParameterLog } from './txn-member-health-parameter-log.model';

// Note: MstHealthParameter and MstHealthParameterUnit will be imported via SequelizeModule.forFeature

@Table({
  freezeTableName: true,
  modelName: 'txn_member_health_parameters',
  schema: 'public',
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
  list: {},
  details: {},
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

  // MstHealthParameter relationship - will be resolved via SequelizeModule.forFeature
  declare healthParameter: any;

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

  // MstHealthParameterUnit relationship - will be resolved via SequelizeModule.forFeature
  declare healthParameterUnit: any;
}
