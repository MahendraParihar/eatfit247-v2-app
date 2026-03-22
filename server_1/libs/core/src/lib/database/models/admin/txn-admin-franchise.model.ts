import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_admin_franchises',
  schema: 'public',
  tableName: 'txn_admin_franchises',
  timestamps: false,
})
export class TxnAdminFranchise extends Model<TxnAdminFranchise> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'admin_franchise_id',
    autoIncrement: true,
  })
  declare adminFranchiseId: number;

  @Column({
    allowNull: false,
    field: 'admin_id',
    type: DataType.INTEGER,
  })
  declare adminId: number;

  @Column({
    allowNull: false,
    field: 'franchise_id',
    type: DataType.INTEGER,
  })
  declare franchiseId: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  declare updatedAt: Date;

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
}
