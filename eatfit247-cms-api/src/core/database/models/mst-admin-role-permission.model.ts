import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstAdminRole } from './mst-admin-role.model';

@Table({
  modelName: 'mst_admin_role_permission',
  schema: 'public',
})
export class MstAdminRolePermission extends Model<MstAdminRolePermission> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'admin_role_permission_id',
    autoIncrement: true,
  })
  adminRolePermissionId: number;

  @BelongsTo(() => MstAdminRole, {
    foreignKey: 'roleId',
    targetKey: 'roleId',
    as: 'Role',
  })
  @Column({
    allowNull: false,
    field: 'role_id',
    type: DataType.INTEGER,
  })
  roleId: number;

  @Column({
    allowNull: false,
    field: 'admin_id',
    type: DataType.INTEGER,
  })
  adminId: number;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
  })
  active: boolean;

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
