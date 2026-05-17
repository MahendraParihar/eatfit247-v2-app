import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  freezeTableName: true,
  modelName: 'mst_admin_actions',
  schema: 'public',
  tableName: 'mst_admin_actions',
  timestamps: false,
})
export class MstAdminAction extends Model<MstAdminAction> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'action_id',
    autoIncrement: true,
  })
  declare actionId: number;

  @Column({
    allowNull: false,
    field: 'action_code',
    type: DataType.STRING(50),
    unique: true,
  })
  declare actionCode: string;

  @Column({
    allowNull: false,
    field: 'action_name',
    type: DataType.STRING(50),
  })
  declare actionName: string;
}
