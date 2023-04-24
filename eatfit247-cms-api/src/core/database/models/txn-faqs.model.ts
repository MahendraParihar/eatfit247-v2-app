import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { MstFaqCategory } from './mst-faq-category.model';

@Table({
  modelName: 'txn_faqs',
  schema: 'public',
})
export class TxnFaqs extends Model<TxnFaqs> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'faq_id',
    autoIncrement: true,
  })
  faqId: number;

  @BelongsTo(() => MstFaqCategory, {
    foreignKey: 'faqCategoryId',
    targetKey: 'faqCategoryId',
    as: 'FaqCategory',
  })
  @Column({
    allowNull: false,
    field: 'faq_category_id',
    type: DataType.INTEGER,
  })
  faqCategoryId: number;

  @Column({
    allowNull: false,
    field: 'faq',
    type: DataType.STRING(500),
  })
  faq: string;

  @Column({
    allowNull: false,
    field: 'answer',
    type: DataType.TEXT,
  })
  answer: string;

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
