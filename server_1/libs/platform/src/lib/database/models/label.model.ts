import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'mst_label',
  schema: 'public',
  freezeTableName: true,
  timestamps: false,
})
export class LabelModel extends Model<LabelModel> {
  @Column({
    field: 'label_id',
    allowNull: false,
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare labelId: number;

  @Column({
    field: 'label_key',
    allowNull: false,
    type: DataType.STRING(100),
  })
  declare labelKey: string;

  @Column({
    field: 'label',
    allowNull: false,
    type: DataType.TEXT,
  })
  declare label: string;

  @Column({
    field: 'applicability',
    allowNull: false,
    type: DataType.ENUM('admin', 'web'),
  })
  declare applicability: string;
}

