import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'mst_urine_output',
  schema: 'public',
})
export class MstUrineOutput extends Model<MstUrineOutput> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'urine_output_id',
    autoIncrement: true,
  })
  urineOutputId: number;

  @Column({
    allowNull: false,
    field: 'urine_output',
    type: DataType.STRING(50),
  })
  urineOutput: string;

  @Column({
    allowNull: true,
    field: 'image_path',
    type: DataType.JSONB,
    defaultValue: null,
  })
  imagePath: string;

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
