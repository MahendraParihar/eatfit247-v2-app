import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminRole } from './mst-admin-role.model';
import { MstAdminSubject } from './mst-admin-subject.model';
import { MstAdminAction } from './mst-admin-action.model';

// IP field max length (matches InputLengthEnum.IP = 21, inlined to avoid circular import)
const IP_LENGTH = 50;

@Table({
  freezeTableName: true,
  modelName: 'mst_admin_role_subject_permissions',
  schema: 'public',
  tableName: 'mst_admin_role_subject_permissions',
  timestamps: false,
  indexes: [
    {
      unique: false,
      fields: ['role_id'],
      name: 'ix_mst_admin_role_subject_permissions_role_id',
    },
    {
      unique: false,
      fields: ['subject_id'],
      name: 'ix_mst_admin_role_subject_permissions_subject_id',
    },
    {
      unique: true,
      fields: ['role_id', 'subject_id', 'action_id'],
      name: 'uq_role_subject_action',
    },
  ],
})
export class MstAdminRoleSubjectPermission extends Model<MstAdminRoleSubjectPermission> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'permission_id',
    autoIncrement: true,
  })
  declare permissionId: number;

  @Column({
    allowNull: false,
    field: 'role_id',
    type: DataType.INTEGER,
  })
  declare roleId: number;

  @Column({
    allowNull: false,
    field: 'subject_id',
    type: DataType.INTEGER,
  })
  declare subjectId: number;

  @Column({
    allowNull: false,
    field: 'action_id',
    type: DataType.INTEGER,
  })
  declare actionId: number;

  @Column({
    allowNull: false,
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

  @Column({
    allowNull: false,
    field: 'modified_by',
    type: DataType.INTEGER,
  })
  declare modifiedBy: number;

  @Column({
    allowNull: false,
    field: 'created_ip',
    type: DataType.STRING(IP_LENGTH),
  })
  declare createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(IP_LENGTH),
  })
  declare modifiedIp: string;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare updatedAt: Date;

  @BelongsTo(() => MstAdminRole, { foreignKey: 'roleId', targetKey: 'roleId', as: 'role' })
  declare role: MstAdminRole;

  @BelongsTo(() => MstAdminSubject, { foreignKey: 'subjectId', targetKey: 'subjectId', as: 'subject' })
  declare subject: MstAdminSubject;

  @BelongsTo(() => MstAdminAction, { foreignKey: 'actionId', targetKey: 'actionId', as: 'action' })
  declare action: MstAdminAction;
}
