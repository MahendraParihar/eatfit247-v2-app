import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'mst_email_templates',
  schema: 'public',
})
export class MstEmailTemplate extends Model<MstEmailTemplate> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'email_template_id',
    autoIncrement: true,
  })
  emailTemplateId: number;

  @Column({
    allowNull: false,
    field: 'template_name',
    type: DataType.STRING(50),
  })
  templateName: string;

  @Column({
    allowNull: false,
    field: 'subject',
    type: DataType.STRING(100),
  })
  subject: string;

  @Column({
    allowNull: false,
    field: 'body',
    type: DataType.STRING(4000),
  })
  body: string;

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
}
