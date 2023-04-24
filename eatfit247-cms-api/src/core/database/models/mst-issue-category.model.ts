import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'mst_issue_categories',
  schema: 'public',
  indexes: [
    {
      unique: false,
      fields: ['sequence'],
      name: 'ix_mst_issue_categories_sequence',
    },
  ],
})
export class MstIssueCategory extends Model<MstIssueCategory> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'issue_category_id',
    autoIncrement: true,
  })
  issueCategoryId: number;

  @Column({
    allowNull: false,
    field: 'issue_category',
    type: DataType.STRING(50),
  })
  issueCategory: string;

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
