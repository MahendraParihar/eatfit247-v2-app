import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'txn_diet_template',
  schema: 'public',
})
export class TxnDietTemplate extends Model<TxnDietTemplate> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'diet_template_id',
    autoIncrement: true,
  })
  dietTemplateId: number;

  @Column({
    allowNull: false,
    field: 'diet_template',
    type: DataType.STRING(100),
  })
  dietTemplate: string;

  @Column({
    allowNull: false,
    field: 'no_of_cycle',
    type: DataType.INTEGER,
  })
  noOfCycle: number;

  @Column({
    allowNull: false,
    field: 'days_in_cycle',
    type: DataType.INTEGER,
  })
  noOfDaysInCycle: number;

  @Column({
    allowNull: false,
    field: 'is_weekly',
    type: DataType.BOOLEAN,
  })
  isWeekly: boolean;

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
    allowNull: true,
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
    allowNull: true,
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
