import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'mst_program_category',
  schema: 'public',
})
export class MstProgramCategory extends Model<MstProgramCategory> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'program_category_id',
    autoIncrement: true,
  })
  programCategoryId: number;

  @Column({
    allowNull: false,
    field: 'program_category',
    type: DataType.STRING(50),
  })
  programCategory: string;

  @Column({
    allowNull: true,
    field: 'image_path',
    type: DataType.JSONB,
  })
  imagePath: string;

  @Column({
    allowNull: false,
    field: 'url',
    type: DataType.STRING(250),
  })
  url: string;

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
