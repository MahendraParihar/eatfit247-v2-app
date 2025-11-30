import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser, getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminRole } from '@server/common';
import { InputLengthEnum } from 'eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_admin_role_permissions',
  schema: 'public',
  tableName: 'mst_admin_role_permissions',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstAdminRole,
        as: 'role',
        required: false,
        attributes: ['roleId', 'role'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstAdminRole,
        as: 'role',
        required: false,
        attributes: ['roleId', 'role'],
      },
    ],
  },
}))
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
    as: 'role',
  })
  role: any;

  @Column({
    allowNull: false,
    field: 'role_id',
    type: DataType.INTEGER,
  })
  roleId: number;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'adminId',
    targetKey: 'adminId',
    as: 'admin',
  })
  admin: MstAdminUser;

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

