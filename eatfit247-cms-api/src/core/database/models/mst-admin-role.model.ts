import { Column, CreatedAt, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  modelName: 'mst_admin_role',
  schema: 'public',
  createdAt: true,
  updatedAt: false,
})
export class MstAdminRole extends Model<MstAdminRole> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'role_id',
    autoIncrement: true,
  })
  roleId: number;

  @Column({
    allowNull: false,
    field: 'role',
  })
  role: string;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  createdAt: Date;
}
