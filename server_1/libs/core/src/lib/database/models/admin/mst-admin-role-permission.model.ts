import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { MstAdminUser } from './mst-admin-user.model';
import { MstAdminRole } from './mst-admin-role.model';

@Table({
  freezeTableName: true,
  modelName: 'mst_admin_role_permissions',
  schema: 'public',
  tableName: 'mst_admin_role_permissions',
  timestamps: false,
  indexes: [
    {
      unique: false,
      fields: ['admin_id'],
      name: 'ix_mst_admin_role_permission_admin_id',
    },
  ],
})
export class MstAdminRolePermission extends Model<MstAdminRolePermission> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'admin_role_permission_id',
    autoIncrement: true,
  })
  declare adminRolePermissionId: number;

  @Column({
    allowNull: false,
    field: 'role_id',
    type: DataType.INTEGER,
  })
  declare roleId: number;

  @Column({
    allowNull: false,
    field: 'admin_id',
    type: DataType.INTEGER,
  })
  declare adminId: number;

  @Column({
    allowNull: true,
    field: 'active',
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare active: boolean;

  @Column({
    allowNull: false,
    field: 'created_by',
    type: DataType.INTEGER,
  })
  declare createdBy: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @Column({
    allowNull: false,
    field: 'modified_by',
    type: DataType.INTEGER,
  })
  declare modifiedBy: number;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare updatedAt: Date;

  @Column({
    allowNull: false,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare modifiedIp: string;

  @BelongsTo(() => MstAdminUser, { foreignKey: 'adminId', targetKey: 'adminId', as: 'admin' })
  declare admin: MstAdminUser;

  @BelongsTo(() => MstAdminRole, { foreignKey: 'roleId', targetKey: 'roleId', as: 'role' })
  declare role: MstAdminRole;
}
