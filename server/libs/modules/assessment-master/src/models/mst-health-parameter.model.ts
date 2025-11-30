import { BelongsTo, Column, CreatedAt, DataType, Index, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, CommonScopes } from '@server/common';
import { InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_health_parameters',
  schema: 'public',
  tableName: 'mst_health_parameters',
  indexes: [
    {
      unique: false,
      fields: ['sequence'],
      name: 'mst_health_parameters_sequence_index',
    },
  ],
})
@Scopes(() => ({
  list: CommonScopes.list,
  details: CommonScopes.details,
}))
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
    allowNull: false,
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
    defaultValue: true,
    field: 'is_length',
    type: DataType.BOOLEAN,
  })
  isLength: boolean;

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
    defaultValue: false,
    field: 'required_field',
    type: DataType.BOOLEAN,
  })
  requiredField: boolean;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  active: boolean;

  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminId' })
  createdByUser: MstAdminUser;

  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminId' })
  updatedByUser: MstAdminUser;

  @Column({
    allowNull: false,
    field: 'created_by',
    type: DataType.INTEGER,
  })
  createdBy: number;

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
  modifiedBy: number;

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
  createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  modifiedIp: string;
}

