import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript';
import { MstFieldType } from './mst_field_type.model';

@Table({
  modelName: 'mst_config',
  schema: 'public',
  timestamps: false,
})
export class MstConfig extends Model<MstConfig> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'config_id',
    autoIncrement: true,
  })
  configId: number;

  @Column({
    allowNull: false,
    field: 'config_name',
    type: DataType.STRING(100),
  })
  configName: string;

  @Column({
    allowNull: false,
    field: 'config_value',
    type: DataType.STRING(200),
  })
  configValue: string;

  @BelongsTo(() => MstFieldType, {
    foreignKey: 'fieldTypeId',
    targetKey: 'fieldTypeId',
    as: 'ConfigFieldTypeMap',
  })
  @Column({
    allowNull: true,
    field: 'field_type_id',
  })
  fieldTypeId: number;
}
