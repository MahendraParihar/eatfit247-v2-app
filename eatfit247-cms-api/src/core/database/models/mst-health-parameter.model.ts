import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'mst_health_parameters',
  schema: 'public',
  indexes: [
    {
      unique: false,
      fields: ['sequence'],
      name: 'ix_mst_health_parameters_sequence',
    },
  ],
})
export class MstHealthParameter extends Model<MstHealthParameter> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'health_parameter_id',
    autoIncrement: true,
  })
  healthParameterId: number;

  @Column({
    allowNull: false,
    field: 'health_parameter',
    type: DataType.STRING(50),
  })
  healthParameter: string;

  @Column({
    allowNull: true,
    field: 'hint_text',
    type: DataType.STRING(50),
  })
  hintText: string;

  @Column({
    allowNull: true,
    field: 'image_path',
    type: DataType.JSONB,
  })
  imagePath: string;

  @Column({
    allowNull: false,
    field: 'sequence',
    type: DataType.INTEGER,
  })
  sequence: number;

  @Column({
    allowNull: false,
    field: 'field_type',
    type: DataType.STRING(10),
  })
  fieldType: string;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
  })
  active: boolean;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'required_field',
  })
  requiredField: boolean;

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
