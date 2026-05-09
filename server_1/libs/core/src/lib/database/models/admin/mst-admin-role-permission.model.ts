import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { MstAdminUser } from './mst-admin-user.model';
import { MstAdminRole } from './mst-admin-role.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_admin_user_roles',
  schema: 'public',
  tableName: 'txn_admin_user_roles',
  timestamps: false,
  indexes: [
    {
      unique: false,
      fields: ['admin_id'],
      name: 'ix_txn_admin_user_roles_admin_id',
    },
  ],
})
export class TxnAdminUserRole extends Model<TxnAdminUserRole> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'admin_user_role_id',
    autoIncrement: true,
  })
  declare adminUserRoleId: number;

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

/** @deprecated Use TxnAdminUserRole instead */
export const MstAdminRolePermission = TxnAdminUserRole;
/** @deprecated Use TxnAdminUserRole instead */
export type MstAdminRolePermission = TxnAdminUserRole;
