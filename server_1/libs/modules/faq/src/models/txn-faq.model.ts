import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { MstFaqCategory } from './mst-faq-category.model';
import { InputLengthEnum } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_faqs',
  schema: 'public',
  tableName: 'txn_faqs',
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstFaqCategory,
        as: 'faqCategory',
        required: false,
        attributes: ['faqCategoryId', 'faqCategory'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstFaqCategory,
        as: 'faqCategory',
        required: false,
        attributes: ['faqCategoryId', 'faqCategory'],
      },
    ],
  },
}))
export class TxnFaq extends Model<TxnFaq> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'faq_id',
    autoIncrement: true,
  })
  declare faqId: number;

  @BelongsTo(() => MstFaqCategory, { as: 'faqCategory', foreignKey: 'faqCategoryId', targetKey: 'faqCategoryId' })
  declare faqCategory: MstFaqCategory;

  @Column({
    allowNull: false,
    field: 'faq_category_id',
    type: DataType.INTEGER,
  })
  declare faqCategoryId: number;

  @Column({
    allowNull: false,
    field: 'faq',
    type: DataType.STRING(InputLengthEnum.CHAR_500),
  })
  declare faq: string;

  @Column({
    allowNull: false,
    field: 'answer',
    type: DataType.TEXT,
  })
  declare answer: string;

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
}

