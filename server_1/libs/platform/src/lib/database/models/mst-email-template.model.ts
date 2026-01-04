import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';

@Table({
  freezeTableName: true,
  modelName: 'mst_email_templates',
  schema: 'public',
  tableName: 'mst_email_templates',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
}))
export class MstEmailTemplate extends Model<MstEmailTemplate> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'email_template_id',
    autoIncrement: true,
  })
  declare emailTemplateId: number;
  @Column({
    allowNull: false,
    field: 'template_name',
    type: DataType.STRING(50),
  })
  declare templateName: string;
  @Column({
    allowNull: false,
    field: 'subject',
    type: DataType.STRING(100),
  })
  declare subject: string;
  @Column({
    allowNull: false,
    field: 'body',
    type: DataType.TEXT,
  })
  declare body: string;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;
  @BelongsTo(() => MstAdminUser, { as: 'createdByUser', foreignKey: 'createdBy', targetKey: 'adminId' })
  declare createdByUser: MstAdminUser;
  @BelongsTo(() => MstAdminUser, { as: 'updatedByUser', foreignKey: 'modifiedBy', targetKey: 'adminId' })
  declare updatedByUser: MstAdminUser;
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
  })
  declare updatedAt: Date;
}

