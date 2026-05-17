import { Column, CreatedAt, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  freezeTableName: true,
  modelName: 'mst_admin_roles',
  schema: 'public',
  tableName: 'mst_admin_roles',
  timestamps: false,
})
export class MstAdminRole extends Model<MstAdminRole> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'role_id',
    autoIncrement: true,
  })
  declare roleId: number;

  @Column({
    allowNull: false,
    field: 'role',
    type: DataType.STRING(50),
  })
  declare role: string;

  @Column({
    allowNull: false,
    field: 'role_code',
    type: DataType.STRING(100),
  })
  declare roleCode: string;

  @Column({
    allowNull: false,
    field: 'grant_all_on_new_subject',
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare grantAllOnNewSubject: boolean;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;
}

