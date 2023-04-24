import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstHealthParameterUnit } from './mst-health-parameter-unit.model';
import { MstHealthParameter } from './mst-health-parameter.model';

@Table({
  modelName: 'mst_health_parameter_unit_mappings',
  schema: 'public',
  indexes: [
    {
      unique: false,
      fields: ['health_parameter_id'],
      name: 'idx_mst_health_parameter_unit_mapping_h_p_id',
    },
    {
      unique: true,
      fields: ['health_parameter_unit_id', 'health_parameter_id'],
      name: 'uq_idx_mst_health_parameter_unit_mapping_h_p_h_p_id',
    },
  ],
})
export class MstHealthParameterUnitMapping extends Model<MstHealthParameterUnitMapping> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'health_parameter_unit_mapping_id',
    autoIncrement: true,
  })
  healthParameterUnitMappingId: number;

  @BelongsTo(() => MstHealthParameterUnit, {
    foreignKey: 'healthParameterUnitId',
    targetKey: 'healthParameterUnitId',
    as: 'HealthParameterUnitMappingUnit',
    foreignKeyConstraint: true,
  })
  @Column({
    allowNull: false,
    field: 'health_parameter_unit_id',
    type: DataType.INTEGER,
  })
  healthParameterUnitId: number;

  @BelongsTo(() => MstHealthParameter, {
    foreignKey: 'healthParameterId',
    targetKey: 'healthParameterId',
    as: 'HealthParameterUnitMappingHealthParameter',
    foreignKeyConstraint: true,
  })
  @Column({
    allowNull: false,
    field: 'health_parameter_id',
    type: DataType.INTEGER,
  })
  healthParameterId: number;

  @Column({
    allowNull: true,
    field: 'default_selected',
  })
  defaultSelected: boolean;

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
