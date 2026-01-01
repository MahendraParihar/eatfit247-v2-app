import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'mst_configs',
  schema: 'public',
  freezeTableName: true,
  timestamps: false,
})
export class AppConfigModel extends Model<AppConfigModel> {
  @Column({
    field: 'config_id',
    allowNull: false,
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare configId: number;

  @Column({
    field: 'config_name',
    allowNull: false,
    type: DataType.STRING(100),
  })
  declare configName: string;

  @Column({
    field: 'config_value',
    allowNull: false,
    type: DataType.TEXT,
  })
  declare configValue: string;

  @Column({
    field: 'module',
    allowNull: false,
    type: DataType.STRING(20),
  })
  declare module: string;
}

