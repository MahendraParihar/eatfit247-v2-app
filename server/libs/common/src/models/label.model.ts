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
  labelId: number;

  @Column({
    field: 'label_key',
    allowNull: false,
    type: DataType.STRING(100),
  })
  labelKey: string;

  @Column({
    field: 'label',
    allowNull: false,
    type: DataType.TEXT,
  })
  label: string;

  @Column({
    field: 'applicability',
    allowNull: false,
    type: DataType.ENUM('admin', 'web'),
  })
  applicability: string;
}

